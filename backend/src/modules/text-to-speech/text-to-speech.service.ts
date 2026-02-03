import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
}

export interface TextToSpeechResult {
  audioUrl?: string;
  audioBuffer?: Buffer;
  format: string;
  provider: 'elevenlabs' | 'mock';
  charCount: number;
  duration?: number;
}

@Injectable()
export class TextToSpeechService {
  private readonly logger = new Logger(TextToSpeechService.name);
  private readonly ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  private readonly ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
  private readonly isEnabled = !!this.ELEVENLABS_API_KEY;

  // Voces disponibles
  private readonly availableVoices: VoiceOption[] = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', language: 'en', gender: 'female' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', language: 'en', gender: 'female' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', language: 'en', gender: 'female' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', language: 'en', gender: 'male' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', language: 'en', gender: 'male' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', language: 'en', gender: 'male' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', language: 'en', gender: 'male' },
    { id: 'spanish-female', name: 'María', language: 'es', gender: 'female' },
    { id: 'spanish-male', name: 'Carlos', language: 'es', gender: 'male' },
  ];

  /**
   * Get list of available voices
   */
  getAvailableVoices(): VoiceOption[] {
    return this.availableVoices;
  }

  /**
   * Get voices by language
   */
  getVoicesByLanguage(language: string): VoiceOption[] {
    return this.availableVoices.filter((voice) => voice.language === language);
  }

  /**
   * Convert text to speech
   */
  async convertTextToSpeech(
    text: string,
    options: {
      voiceId?: string;
      language?: string;
      modelId?: string;
    } = {},
  ): Promise<TextToSpeechResult> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text is required for text-to-speech');
    }

    const { voiceId, language = 'en', modelId } = options;

    this.logger.log(
      `Converting ${text.length} chars to speech (voice: ${voiceId || 'default'})`,
    );

    // Si ElevenLabs está habilitado, usarlo
    if (this.isEnabled && voiceId && !voiceId.startsWith('spanish-')) {
      try {
        return await this.convertWithElevenLabs(text, voiceId, modelId);
      } catch (error: any) {
        this.logger.error(
          `ElevenLabs TTS failed: ${error?.message}`,
          error?.stack,
        );
        // Fallback to mock
        return this.convertWithMock(text, language);
      }
    }

    // Usar versión mock para desarrollo
    return this.convertWithMock(text, language);
  }

  /**
   * Convert text to speech using ElevenLabs
   */
  private async convertWithElevenLabs(
    text: string,
    voiceId: string,
    modelId?: string,
  ): Promise<TextToSpeechResult> {
    const model = modelId || process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1';

    try {
      const response = await axios.post(
        `${this.ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        {
          headers: {
            'xi-api-key': this.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        },
      );

      const audioBuffer = Buffer.from(response.data);

      this.logger.log(`ElevenLabs TTS successful: ${audioBuffer.length} bytes`);

      return {
        audioBuffer,
        format: 'mp3',
        provider: 'elevenlabs',
        charCount: text.length,
        duration: this.estimateDuration(text.length),
      };
    } catch (error: any) {
      this.logger.error(
        `ElevenLabs API error: ${error?.message}`,
        error?.response?.data || error?.stack,
      );
      throw new ServiceUnavailableException(
        `Text-to-speech service unavailable: ${error?.message}`,
      );
    }
  }

  /**
   * Convert text to speech using mock (for development)
   */
  private async convertWithMock(
    text: string,
    language: string,
  ): Promise<TextToSpeechResult> {
    this.logger.log(`Using mock TTS for ${text.length} chars`);

    // Generar un audio mock (silencio) de 5 segundos
    const duration = this.estimateDuration(text.length);
    const audioBuffer = this.generateMockAudio(duration);

    return {
      audioBuffer,
      format: 'mp3',
      provider: 'mock',
      charCount: text.length,
      duration,
    };
  }

  /**
   * Generate mock audio buffer (silence)
   */
  private generateMockAudio(durationSeconds: number): Buffer {
    // Crear un buffer que represente silencio en MP3
    // Este es un archivo MP3 válido pero vacío/silencioso
    const mockMp3Header = Buffer.from([
      0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    // Repetir el header para simular duración
    const frames = Math.ceil((durationSeconds * 44100) / 1152); // 1152 samples per frame
    const buffers: Buffer[] = [];

    for (let i = 0; i < Math.min(frames, 100); i++) {
      buffers.push(mockMp3Header);
    }

    return Buffer.concat(buffers);
  }

  /**
   * Estimate audio duration based on text length
   * Assuming average reading speed of 150 words per minute
   */
  private estimateDuration(charCount: number): number {
    const wordsPerMinute = 150;
    const avgCharsPerWord = 5;
    const words = charCount / avgCharsPerWord;
    const minutes = words / wordsPerMinute;
    return Math.ceil(minutes * 60); // Convert to seconds
  }

  /**
   * Convert summary to speech
   */
  async convertSummaryToSpeech(
    summaryText: string,
    language: string = 'en',
  ): Promise<TextToSpeechResult> {
    const voices = this.getVoicesByLanguage(language);
    const voiceId = voices[0]?.id || this.availableVoices[0].id;

    return this.convertTextToSpeech(summaryText, {
      voiceId,
      language,
    });
  }

  /**
   * Check if ElevenLabs is enabled
   */
  isElevenLabsEnabled(): boolean {
    return this.isEnabled;
  }
}
