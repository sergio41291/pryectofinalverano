import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { AudioResult, AudioResultStatus } from './entities/audio-result.entity';
import { UploadsService } from '../uploads/uploads.service';
import { Upload } from '../uploads/entities/upload.entity';
import { AudioService } from './audio.service';
import { AiService } from '../ai/ai.service';
import { StorageService } from '../storage/storage.service';

@Processor('audio')
export class AudioProcessor {
  private readonly logger = new Logger(AudioProcessor.name);
  private readonly ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
  private readonly ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

  constructor(
    @InjectRepository(AudioResult)
    private readonly audioResultRepository: Repository<AudioResult>,
    @Inject(forwardRef(() => UploadsService))
    private readonly uploadsService: UploadsService,
    private readonly audioService: AudioService,
    private readonly aiService: AiService,
    private readonly storageService: StorageService,
  ) {
    if (!this.ASSEMBLYAI_API_KEY) {
      this.logger.error('ASSEMBLYAI_API_KEY environment variable is not set');
    }
  }

  @Process()
  async processAudio(job: Job): Promise<void> {
    const { uploadId, audioResultId, language, userId } = job.data;

    try {
      this.logger.log(`Processing audio job ${job.id} for upload ${uploadId}`);

      // Obtener el archivo de upload
      const upload = await this.uploadsService.findById(uploadId);
      if (!upload) {
        throw new Error(`Upload not found: ${uploadId}`);
      }

      // Obtener el buffer del archivo (se almacena en la entidad Upload)
      let fileBuffer: Buffer;
      if (upload.fileBuffer) {
        fileBuffer = Buffer.isBuffer(upload.fileBuffer)
          ? upload.fileBuffer
          : Buffer.from(upload.fileBuffer);
      } else {
        throw new Error('File buffer not available');
      }

      // Subir a AssemblyAI
      const uploadUrl = await this.uploadToAssemblyAI(fileBuffer, upload.originalFileName);
      this.logger.log(`File uploaded to AssemblyAI: ${uploadUrl}`);

      // Iniciar transcripción
      const assemblyAiId = await this.transcribeAudio(uploadUrl, language);
      this.logger.log(`Transcription submitted to AssemblyAI with ID: ${assemblyAiId}`);

      // Actualizar estado a processing con el ID de AssemblyAI
      const audioResult = await this.audioService.getAudioResultById(audioResultId);
      audioResult.assemblyAiId = assemblyAiId;
      audioResult.status = AudioResultStatus.PROCESSING;
      await this.audioResultRepository.save(audioResult);

      // Esperar a que se complete la transcripción
      const transcriptionResult = await this.waitForTranscription(assemblyAiId);

      // Guardar resultados
      audioResult.transcription = transcriptionResult.text;
      audioResult.assemblyAiResponse = transcriptionResult;
      audioResult.language = language || transcriptionResult.language_code;
      
      if (transcriptionResult.language_code && transcriptionResult.language_confidence) {
        audioResult.languageDetails = {
          detected: transcriptionResult.language_code,
          confidence: transcriptionResult.language_confidence,
        };
      }

      // Generar resumen usando Claude con streaming
      this.logger.log(`Generating AI summary for audio ${uploadId}`);
      let fullSummary = '';

      try {
        const summaryGenerator = this.aiService.streamSummarize({
          text: transcriptionResult.text,
          language: audioResult.language || 'auto',
          style: 'bullet-points',
          maxTokens: 1024,
        });

        // Consumir el stream y acumular el resumen
        for await (const chunk of summaryGenerator) {
          fullSummary += chunk;
        }

        audioResult.summary = fullSummary;
        this.logger.log(`AI summary generated for audio ${uploadId}`);
      } catch (aiError: any) {
        this.logger.error(`Failed to generate AI summary: ${aiError?.message}`, aiError?.stack);
        // Continuar sin resumen si falla la IA
        audioResult.summary = '';
      }

      // Guardar los archivos en MinIO
      try {
        // Guardar transcripción en MinIO
        const transcriptionPath = await this.storageService.uploadSummary(
          userId,
          uploadId,
          `**Transcripción de audio:**\n\n${transcriptionResult.text}`,
          'transcription'
        );
        audioResult.transcriptionMinioPath = transcriptionPath;
        this.logger.log(`Transcription saved to MinIO at ${transcriptionPath}`);

        // Guardar resumen en MinIO si se generó
        if (fullSummary) {
          const summaryPath = await this.storageService.uploadSummary(
            userId,
            uploadId,
            fullSummary,
            'summary'
          );
          audioResult.summaryMinioPath = summaryPath;
          this.logger.log(`Summary saved to MinIO at ${summaryPath}`);
        }

        // Guardar archivo de audio original en MinIO
        if (fileBuffer) {
          const audioFileName = upload.originalFileName || `audio_${uploadId}.wav`;
          const audioPath = await this.storageService.uploadAudioFile(
            userId,
            uploadId,
            fileBuffer,
            audioFileName
          );
          audioResult.audioMinioPath = audioPath;
          this.logger.log(`Audio file saved to MinIO at ${audioPath}`);
        }
      } catch (storageError: any) {
        this.logger.error(`Failed to save files to MinIO: ${storageError?.message}`, storageError?.stack);
        // Continuar sin almacenamiento si falla
      }

      audioResult.status = AudioResultStatus.COMPLETED;
      audioResult.completedAt = new Date();
      await this.audioResultRepository.save(audioResult);

      // Actualizar upload con el resumen y texto extraído
      await this.uploadsService.update(uploadId, {
        extractedText: fullSummary || transcriptionResult.text,
        summary: fullSummary,
        status: 'completed',
        processedAt: new Date(),
      });

      this.logger.log(`Audio processing completed for job ${job.id}`);
    } catch (error: any) {
      this.logger.error(`Audio processing failed for job ${job.id}: ${error?.message}`, error?.stack);

      // Guardar error en la base de datos
      try {
        const audioResult = await this.audioService.getAudioResultById(audioResultId);
        audioResult.status = AudioResultStatus.FAILED;
        audioResult.errorMessage = error?.message || 'Unknown error';
        audioResult.completedAt = new Date();
        await this.audioResultRepository.save(audioResult);
      } catch (saveError) {
        this.logger.error(`Failed to save error status: ${saveError}`);
      }

      throw error;
    }
  }

  private async uploadToAssemblyAI(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.ASSEMBLYAI_API_URL}/upload`,
        fileBuffer,
        {
          headers: {
            Authorization: this.ASSEMBLYAI_API_KEY,
            'Content-Type': 'application/octet-stream',
          },
        },
      );

      return response.data.upload_url;
    } catch (error: any) {
      this.logger.error(
        `Failed to upload to AssemblyAI: ${error?.message}`,
        error?.response?.data || error?.stack,
      );
      throw new Error(`Failed to upload audio to AssemblyAI: ${error?.message}`);
    }
  }

  private async transcribeAudio(
    uploadUrl: string,
    language?: string,
  ): Promise<string> {
    try {
      const payload: any = {
        audio_url: uploadUrl,
        language_detection: !language, // Detectar automáticamente si no se especifica idioma
      };

      // Si se especifica idioma, usarlo
      if (language) {
        payload.language_code = this.mapLanguageToAssemblyAI(language);
      }

      const response = await axios.post(
        `${this.ASSEMBLYAI_API_URL}/transcript`,
        payload,
        {
          headers: {
            Authorization: this.ASSEMBLYAI_API_KEY,
          },
        },
      );

      return response.data.id;
    } catch (error: any) {
      this.logger.error(
        `Failed to initiate transcription: ${error?.message}`,
        error?.response?.data || error?.stack,
      );
      throw new Error(`Failed to initiate transcription: ${error?.message}`);
    }
  }

  private async waitForTranscription(
    transcriptId: string,
    maxAttempts: number = 120, // 10 minutos con 5 segundos de espera
    delayMs: number = 5000,
  ): Promise<any> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `${this.ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
          {
            headers: {
              Authorization: this.ASSEMBLYAI_API_KEY,
            },
          },
        );

        const { status, text, language_code, language_confidence, error } =
          response.data;

        if (error) {
          throw new Error(`AssemblyAI error: ${error}`);
        }

        if (status === 'completed') {
          return {
            text,
            language_code,
            language_confidence,
            status,
          };
        }

        if (status === 'error') {
          throw new Error('Transcription failed on AssemblyAI');
        }

        // Aún procesando
        this.logger.debug(
          `Transcription ${transcriptId} status: ${status} (attempt ${attempts + 1}/${maxAttempts})`,
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempts++;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          // Transcript not found yet, retry
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          attempts++;
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Transcription timeout after ${maxAttempts} attempts`);
  }

  private mapLanguageToAssemblyAI(language: string): string {
    // Mapeo de códigos de idioma a códigos de AssemblyAI
    const languageMap: Record<string, string> = {
      es: 'es',
      en: 'en',
      de: 'de',
      fr: 'fr',
      it: 'it',
      pt: 'pt',
      spa: 'es',
      eng: 'en',
      deu: 'de',
      fra: 'fr',
      ita: 'it',
      por: 'pt',
    };

    return languageMap[language.toLowerCase()] || 'en';
  }
}
