import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OcrResult } from './entities/ocr-result.entity';
import { OcrWebSocketGateway } from './ocr-websocket.gateway';
import { OcrCacheService } from './ocr-cache.service';
import { spawn } from 'child_process';
import * as path from 'path';

@Processor('ocr')
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    @InjectRepository(OcrResult)
    private readonly ocrResultRepository: Repository<OcrResult>,
    private readonly websocketGateway: OcrWebSocketGateway,
    private readonly cacheService: OcrCacheService,
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
        // Ejecutar OCR si no está en caché
        result = await this.executeOcrService(uploadId, language);
        
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

      // Emitir evento de fallo de WebSocket
      this.websocketGateway.notifyOcrFailed(userId, uploadId, error?.message || 'Unknown error');

      throw error;
    }
  }

  private async executeOcrService(filePath: string, language: string = 'es'): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonScriptPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'scripts',
        'paddle_ocr_service.py',
      );

      // Generar ruta de salida temporal
      const tempOutputPath = path.join(path.dirname(filePath), `ocr_${Date.now()}.json`);
      
      // El script espera: python script.py <input> <output> [language]
      const args = [filePath, tempOutputPath, language];

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
        if (code !== 0) {
          return reject(new Error(`Python OCR service exited with code ${code}: ${stderr}`));
        }

        try {
          // Leer el archivo JSON generado por el script
          const fs = require('fs');
          if (!fs.existsSync(tempOutputPath)) {
            return reject(new Error(`OCR output file not found: ${tempOutputPath}`));
          }
          
          const outputContent = fs.readFileSync(tempOutputPath, 'utf-8');
          const result = JSON.parse(outputContent);
          
          // Limpiar archivo temporal
          fs.unlinkSync(tempOutputPath);
          
          resolve(result);
        } catch (error: any) {
          reject(new Error(`Failed to parse OCR output: ${error?.message}`));
        }
      });

      pythonProcess.on('error', (error: any) => {
        reject(new Error(`Failed to spawn OCR process: ${error?.message}`));
      });
    });
  }
}
