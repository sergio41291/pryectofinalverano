import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OcrResult } from './entities/ocr-result.entity';
import { spawn } from 'child_process';
import * as path from 'path';

@Processor('ocr')
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    @InjectRepository(OcrResult)
    private readonly ocrResultRepository: Repository<OcrResult>,
  ) {}

  @Process()
  async processOcr(job: Job): Promise<any> {
    const { uploadId, userId, ocrResultId, language } = job.data;

    try {
      this.logger.log(`Processing OCR job ${job.id} for upload ${uploadId}`);

      // Llamar al servicio OCR en Python
      const result = await this.executeOcrService(uploadId, language);

      // Actualizar resultado en MongoDB
      await this.ocrResultRepository.update(
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

      const args = ['--input', filePath, '--language', language, '--output-format', 'json'];

      const pythonProcess = spawn('python', [pythonScriptPath, ...args], {
        timeout: 300000, // 5 minutos
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
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
          const result = JSON.parse(stdout);
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
