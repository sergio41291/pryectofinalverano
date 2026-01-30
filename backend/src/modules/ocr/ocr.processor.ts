import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OcrResult } from './entities/ocr-result.entity';
import { OcrWebSocketGateway } from './ocr-websocket.gateway';
import { OcrCacheService } from './ocr-cache.service';
import { UploadsService } from '../uploads/uploads.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

@Processor('ocr')
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    @InjectRepository(OcrResult)
    private readonly ocrResultRepository: Repository<OcrResult>,
    private readonly websocketGateway: OcrWebSocketGateway,
    private readonly cacheService: OcrCacheService,
    private readonly uploadsService: UploadsService,
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
  ) {}

  @Process()
  async processOcr(job: Job): Promise<any> {
    const { uploadId, userId, ocrResultId, language, fileHash } = job.data;
    let upload: any = null;

    try {
      this.logger.log(`Processing OCR job ${job.id} for upload ${uploadId}`);

      // Emitir evento de inicio de extracción
      this.websocketGateway.notifyExtracting(userId, uploadId);

      // Obtener información del upload PRIMERO
      upload = await this.uploadsService.findById(uploadId);
      
      if (!upload.fileBuffer) {
        throw new Error('File buffer not found in upload record');
      }

      // Buscar en caché primero
      let result = this.cacheService.getCachedResult(fileHash);

      if (result) {
        this.logger.log(`Using cached OCR result for hash: ${fileHash}`);
      } else {
        // Ejecutar OCR desde el buffer
        result = await this.executeOcrFromBuffer(upload.fileBuffer, language, uploadId, userId, upload.originalFileName);
        
        // Guardar en caché
        this.cacheService.saveCachedResult(fileHash, result);
      }

      // ✅ VALIDAR QUE EL OCR TUVO ÉXITO ANTES DE CONTINUAR
      const extractedText = result.text || result.full_text || '';
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('OCR extraction failed: no text extracted from document');
      }

      this.logger.log(`OCR successful: ${extractedText.length} characters extracted`);

      // ✅ SOLO AHORA SUBIR A MINIO si OCR fue exitoso
      if (!upload.minioPath) {
        try {
          const uploadData = {
            buffer: upload.fileBuffer,
            originalname: upload.originalFileName,
            mimetype: upload.mimeType,
            size: upload.fileSize,
          } as any;

          const { path } = await this.storageService.uploadDocument(userId, uploadData, 'uploads/');
          
          // Actualizar con la ruta de MinIO
          await this.uploadsService.update(uploadId, {
            minioPath: path,
            status: 'processing',
          });

          this.logger.log(`Document uploaded to MinIO: ${path}`);
        } catch (uploadError: any) {
          this.logger.error(`Failed to upload document to MinIO: ${uploadError?.message}`);
          throw uploadError;
        }
      }

      // Emitir evento de generación de resumen
      this.websocketGateway.notifyGenerating(userId, uploadId);

      // Actualizar resultado en base de datos
      const updatedResult = await this.ocrResultRepository.update(
        { id: ocrResultId },
        {
          status: 'completed',
          extractedText: {
            text: result.text || result.full_text || '',
            confidence: result.confidence || 0.95,
            language: language,
          },
          metadata: {
            processedPages: result.pages || 1,
            totalPages: result.pages || 1,
            processingTime: result.processing_time || 0,
            modelVersion: result.model_version || 'paddleocr-3.4.0',
          },
          pageResults: result.page_results || [],
          completedAt: new Date(),
        },
      );

      // Emitir evento de WebSocket con resumen
      const ocrResult = await this.ocrResultRepository.findOneBy({ id: ocrResultId });
      if (ocrResult && result.text) {
        try {
          this.logger.log(`Starting summary generation for upload ${uploadId}`);
          let fullSummary = '';
          
          // Generar resumen usando Claude con streaming
          const summaryGenerator = this.aiService.streamSummarize({
            text: result.text || result.full_text || '',
            language: language,
            style: 'bullet-points',
            maxTokens: 1024,
          });

          // Recopilar chunks del resumen
          for await (const chunk of summaryGenerator) {
            fullSummary += chunk;
            // Emitir chunk en tiempo real
            this.websocketGateway.notifyResumChunk(userId, uploadId, chunk);
            this.logger.debug(`Summary chunk received: ${chunk.substring(0, 50)}...`);
          }

          this.logger.log(`Summary generation completed. Length: ${fullSummary.length}`);

          // Guardar el resumen en la base de datos
          await this.ocrResultRepository.update(
            { id: ocrResultId },
            {
              extractedText: {
                ...(ocrResult.extractedText as any),
                summary: fullSummary,
              },
            },
          );

          // Guardar resumen en MinIO
          try {
            await this.storageService.uploadSummary(userId, uploadId, fullSummary);
            this.logger.log(`Summary saved to MinIO for upload ${uploadId}`);
          } catch (summaryError: any) {
            this.logger.error(`Failed to save summary to MinIO: ${summaryError?.message}`);
          }

          // Notificar final
          this.websocketGateway.notifyOcrCompletedWithSummary(userId, uploadId, ocrResult, fullSummary);
        } catch (summaryError: any) {
          this.logger.error(`Failed to generate summary: ${summaryError?.message}`, summaryError?.stack);
          // Continuar sin resumen en lugar de fallar completamente
          this.websocketGateway.notifyOcrCompletedWithSummary(userId, uploadId, ocrResult, '');
        }
      } else {
        this.logger.warn(`No OCR result or text available for summary generation`);
        this.websocketGateway.notifyOcrCompletedWithSummary(userId, uploadId, ocrResult, '');
      }

      this.logger.log(`OCR processing completed for job ${job.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`OCR processing failed for job ${job.id}: ${error?.message}`, error?.stack);

      // Emitir evento de error
      this.websocketGateway.notifyOcrErrorWithSummary(userId, uploadId, error?.message || 'Unknown error');

      // Marcar como fallido
      await this.ocrResultRepository.update(
        { id: ocrResultId },
        {
          status: 'failed',
          errorMessage: error?.message || 'Unknown error',
        },
      );

      // Delete the upload and associated file from storage if OCR fails
      try {
        this.logger.log(`Deleting upload ${uploadId} due to OCR failure`);
        await this.uploadsService.deleteUploadAndFile(uploadId);
      } catch (deleteError: any) {
        this.logger.error(
          `Failed to delete upload ${uploadId} after OCR failure: ${deleteError?.message}`,
          deleteError?.stack,
        );
      }

      // Clear cache entry for this file hash to prevent reusing failed results
      if (fileHash) {
        try {
          this.cacheService.clearCacheEntry(fileHash);
          this.logger.log(`Cleared cache entry for hash: ${fileHash}`);
        } catch (cacheError: any) {
          this.logger.error(`Failed to clear cache entry: ${cacheError?.message}`);
        }
      }

      throw error;
    }
  }

  private async executeOcrService(minioPath: string, language: string = 'es', uploadId: string, userId: string): Promise<any> {
    let tempFilePath: string | null = null;
    let tempOutputPath: string | null = null;

    try {
      // Descargar archivo de MinIO a un archivo temporal
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `ocr_input_${Date.now()}_${uploadId}`);
      
      this.logger.log(`Downloading file from MinIO: ${minioPath} to ${tempFilePath}`);
      
      // Descargar el archivo
      const fileBuffer = await this.storageService.downloadDocument(userId, minioPath);
      fs.writeFileSync(tempFilePath, fileBuffer);

      this.logger.log(`File downloaded, size: ${fileBuffer.length} bytes`);

      // Generar ruta de salida temporal
      tempOutputPath = path.join(tempDir, `ocr_output_${Date.now()}_${uploadId}.json`);

      return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          'scripts',
          'ocr_service.py',
        );

        // Use the Python from the venv if it exists, otherwise use system Python
        const pythonExecutable = process.env.PYTHON_EXECUTABLE || 
          path.join(__dirname, '..', '..', '..', '..', 'venv_ocr', 'Scripts', 'python.exe');

        this.logger.log(`Python script path: ${pythonScriptPath}`);
        this.logger.log(`Python executable: ${pythonExecutable}`);
        this.logger.log(`Input file: ${tempFilePath}`);
        this.logger.log(`Output file: ${tempOutputPath}`);

        if (!tempFilePath || !tempOutputPath) {
          return reject(new Error('Temp file paths not initialized'));
        }

        // El script espera: python script.py <input> <output> [language]
        const args: string[] = [tempFilePath, tempOutputPath, language];

        // Create environment with optimization backends disabled
        // Using system-level environment variables that Paddle respects
        const env = {
          ...process.env,
          PADDLE_USE_MKLDNN: '0',
          MKLDNN_VERBOSE: '0',
          OMP_NUM_THREADS: '1',
          OPENBLAS_NUM_THREADS: '1',
        };

        const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, ...args], {
          timeout: 300000, // 5 minutos
          env,
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
          const output = data.toString().trim();
          // Only log important messages, not debug info
          if (output && !output.startsWith('[DEBUG]')) {
            this.logger.debug(`[OCR] ${output}`);
          }
        });

        pythonProcess.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
          const output = data.toString().trim();
          // Only log actual errors and warnings, not debug info
          if (output && !output.startsWith('[DEBUG]') && !output.startsWith('DEBUG')) {
            this.logger.warn(`[OCR] ${output}`);
          }
        });

        pythonProcess.on('close', (code: number) => {
          try {
            if (code !== 0) {
              return reject(new Error(`Python OCR service exited with code ${code}: ${stderr}`));
            }

            // Leer el archivo JSON generado por el script
            if (!tempOutputPath || !fs.existsSync(tempOutputPath)) {
              return reject(new Error(`OCR output file not found: ${tempOutputPath}`));
            }
            
            const outputContent = fs.readFileSync(tempOutputPath, 'utf-8');
            const result = JSON.parse(outputContent);
            
            resolve(result);
          } catch (error: any) {
            reject(new Error(`Failed to parse OCR output: ${error?.message}`));
          } finally {
            // Limpiar archivos temporales
            if (tempFilePath && fs.existsSync(tempFilePath)) {
              try {
                fs.unlinkSync(tempFilePath);
                this.logger.log(`Cleaned up input file: ${tempFilePath}`);
              } catch (e) {
                this.logger.warn(`Failed to delete input file: ${e}`);
              }
            }
            if (tempOutputPath && fs.existsSync(tempOutputPath)) {
              try {
                fs.unlinkSync(tempOutputPath);
                this.logger.log(`Cleaned up output file: ${tempOutputPath}`);
              } catch (e) {
                this.logger.warn(`Failed to delete output file: ${e}`);
              }
            }
          }
        });

        pythonProcess.on('error', (error: any) => {
          reject(new Error(`Failed to spawn OCR process: ${error?.message}`));
        });
      });
    } catch (error: any) {
      // Limpiar archivos temporales en caso de error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          this.logger.warn(`Failed to delete temp file on error: ${e}`);
        }
      }
      if (tempOutputPath && fs.existsSync(tempOutputPath)) {
        try {
          fs.unlinkSync(tempOutputPath);
        } catch (e) {
          this.logger.warn(`Failed to delete temp output on error: ${e}`);
        }
      }
      throw error;
    }
  }

  private async executeOcrFromBuffer(fileBuffer: Buffer, language: string = 'es', uploadId: string, userId: string, originalFileName: string = 'file'): Promise<any> {
    let tempFilePath: string | null = null;
    let tempOutputPath: string | null = null;

    try {
      if (!fileBuffer) {
        throw new Error('File buffer is empty or undefined');
      }

      const tempDir = os.tmpdir();
      
      // Extraer extensión del archivo original para preservarla
      const fileExtension = path.extname(originalFileName) || '';
      tempFilePath = path.join(tempDir, `ocr_input_${Date.now()}_${uploadId}${fileExtension}`);
      
      fs.writeFileSync(tempFilePath, fileBuffer);

      tempOutputPath = path.join(tempDir, `ocr_output_${Date.now()}_${uploadId}.json`);

      const tempFilePathFinal = tempFilePath; // Capture for closure
      const tempOutputPathFinal = tempOutputPath;

      return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          'scripts',
          'ocr_service.py',
        );

        const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
        
        // Use mock script if PADDLE_MOCK environment variable is set
        const scriptName = process.env.PADDLE_MOCK === 'true' ? 'paddle_ocr_service_mock.py' : 'ocr_service.py';
        const pythonScriptPathFinal = pythonScriptPath.replace('ocr_service.py', scriptName);

        const args: string[] = [tempFilePathFinal, tempOutputPathFinal, language];
        
        // Create environment with optimization backends disabled
        const env = {
          ...process.env,
          PADDLE_USE_MKLDNN: '0',
          MKLDNN_VERBOSE: '0',
          OMP_NUM_THREADS: '1',
          OPENBLAS_NUM_THREADS: '1',
        };
        
        const pythonProcess = spawn(pythonExecutable, [pythonScriptPathFinal, ...args], {
          timeout: 300000,
          env,
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
          this.logger.debug(`[OCR Script] ${data.toString()}`);
        });

        pythonProcess.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
          this.logger.error(`[OCR Script Error] ${data.toString()}`);
        });

        pythonProcess.on('close', (code: number) => {
          try {
            if (code !== 0) {
              return reject(new Error(`Python OCR exited with code ${code}: ${stderr}`));
            }

            if (!tempOutputPathFinal || !fs.existsSync(tempOutputPathFinal)) {
              return reject(new Error(`OCR output file not found: ${tempOutputPathFinal}`));
            }
            
            const outputContent = fs.readFileSync(tempOutputPathFinal, 'utf-8');
            const result = JSON.parse(outputContent);
            
            if (!result.text && !result.full_text) {
              this.logger.warn('OCR returned empty text result');
            }

            this.logger.log(`OCR completed. Text length: ${(result.text || result.full_text || '').length}`);
            resolve({
              text: result.text || result.full_text || '',
              ...result,
            });
          } catch (error: any) {
            reject(new Error(`Failed to parse OCR output: ${error?.message}`));
          } finally {
            if (tempFilePathFinal && fs.existsSync(tempFilePathFinal)) {
              try { fs.unlinkSync(tempFilePathFinal); } catch (e) { /* ignore */ }
            }
            if (tempOutputPathFinal && fs.existsSync(tempOutputPathFinal)) {
              try { fs.unlinkSync(tempOutputPathFinal); } catch (e) { /* ignore */ }
            }
          }
        });

        pythonProcess.on('error', (error: any) => {
          reject(new Error(`Failed to spawn OCR process: ${error?.message}`));
        });
      });
    } catch (error: any) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
      }
      throw error;
    }
  }
}
