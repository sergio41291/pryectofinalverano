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
  ) {}

  @Process()
  async processOcr(job: Job): Promise<any> {
    const { uploadId, userId, ocrResultId, language, fileHash } = job.data;

    try {
      this.logger.log(`Processing OCR job ${job.id} for upload ${uploadId}`);

      // Buscar en caché primero
      let result = this.cacheService.getCachedResult(fileHash);

      if (result) {
        this.logger.log(`Using cached OCR result for hash: ${fileHash}`);
      } else {
        // Obtener información del upload
        const upload = await this.uploadsService.findById(uploadId);
        
        // Ejecutar OCR si no está en caché
        result = await this.executeOcrService(upload.minioPath, language, uploadId, userId);
        
        // Guardar en caché
        this.cacheService.saveCachedResult(fileHash, result);
      }

      // Actualizar resultado en base de datos
      const updatedResult = await this.ocrResultRepository.update(
        { id: ocrResultId },
        {
          status: 'completed',
          extractedText: {
            text: result.text,
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

      // Emitir evento de WebSocket
      const ocrResult = await this.ocrResultRepository.findOneBy({ id: ocrResultId });
      if (ocrResult) {
        this.websocketGateway.notifyOcrCompleted(userId, ocrResult);
      }

      this.logger.log(`OCR processing completed for job ${job.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`OCR processing failed for job ${job.id}: ${error?.message}`, error?.stack);

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

      // Emitir evento de fallo de WebSocket
      this.websocketGateway.notifyOcrFailed(userId, uploadId, error?.message || 'Unknown error');

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
          'paddle_ocr_service.py',
        );

        this.logger.log(`Python script path: ${pythonScriptPath}`);
        this.logger.log(`Input file: ${tempFilePath}`);
        this.logger.log(`Output file: ${tempOutputPath}`);

        if (!tempFilePath || !tempOutputPath) {
          return reject(new Error('Temp file paths not initialized'));
        }

        // El script espera: python script.py <input> <output> [language]
        const args: string[] = [tempFilePath, tempOutputPath, language];

        const pythonProcess = spawn('python', [pythonScriptPath, ...args], {
          timeout: 300000, // 5 minutos
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
          this.logger.debug(`OCR stdout: ${data.toString()}`);
        });

        pythonProcess.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
          this.logger.warn(`OCR stderr: ${data.toString()}`);
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
}
