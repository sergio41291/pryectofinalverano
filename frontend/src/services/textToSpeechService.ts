import api from './api';

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
}

export interface TextToSpeechResult {
  provider: 'elevenlabs' | 'mock';
  format: string;
  charCount: number;
  duration?: number;
  audioSize: number;
}

export const textToSpeechService = {
  /**
   * Get available voices
   */
  async getVoices(): Promise<{
    voices: VoiceOption[];
    isElevenLabsEnabled: boolean;
  }> {
    const response = await api.get<{
      success: boolean;
      data: { voices: VoiceOption[]; isElevenLabsEnabled: boolean };
    }>('/text-to-speech/voices');
    return response.data.data;
  },

  /**
   * Get voices by language
   */
  async getVoicesByLanguage(language: string): Promise<VoiceOption[]> {
    const response = await api.get<{ success: boolean; data: VoiceOption[] }>(
      `/text-to-speech/voices/${language}`,
    );
    return response.data.data;
  },

  /**
   * Convert text to speech and return audio blob
   */
  async convertToSpeech(
    text: string,
    options: {
      voiceId?: string;
      language?: string;
      modelId?: string;
    } = {},
  ): Promise<Blob> {
    const response = await api.post(
      '/text-to-speech/convert',
      {
        text,
        ...options,
        returnAudio: true,
      },
      {
        responseType: 'blob',
      },
    );
    return response.data;
  },

  /**
   * Convert summary to speech
   */
  async convertSummaryToSpeech(
    summaryText: string,
    language?: string,
  ): Promise<Blob> {
    const response = await api.post(
      '/text-to-speech/summary',
      {
        summaryText,
        language,
      },
      {
        responseType: 'blob',
      },
    );
    return response.data;
  },

  /**
   * Get metadata for TTS conversion (without audio)
   */
  async getConversionMetadata(
    text: string,
    options: {
      voiceId?: string;
      language?: string;
      modelId?: string;
    } = {},
  ): Promise<TextToSpeechResult> {
    const response = await api.post<{
      success: boolean;
      data: TextToSpeechResult;
    }>('/text-to-speech/convert', {
      text,
      ...options,
      returnAudio: false,
    });
    return response.data.data;
  },
};

export default textToSpeechService;
