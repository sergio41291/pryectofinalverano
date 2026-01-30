import api from './api';

export interface AudioResult {
  id: string;
  uploadId: string;
  userId: string;
  transcription: string;
  language?: string;
  languageDetails?: {
    language: string;
    confidence?: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  assemblyAiId?: string;
  assemblyAiResponse?: any;
  createdAt: string;
  completedAt?: string;
}

export const audioService = {
  async processAudio(
    uploadId: string,
    language?: string
  ): Promise<{ jobId: string }> {
    const response = await api.post<{ jobId: string }>(
      `/audio/${uploadId}/process`,
      { language }
    );
    return response.data;
  },

  async getAudioResult(uploadId: string): Promise<AudioResult> {
    const response = await api.get<AudioResult>(`/audio/${uploadId}`);
    return response.data;
  },

  async getAudioResultById(id: string): Promise<AudioResult> {
    const response = await api.get<AudioResult>(`/audio/results/${id}`);
    return response.data;
  },

  async listAudioResults(
    page = 1,
    limit = 10
  ): Promise<{ data: AudioResult[]; total: number }> {
    const response = await api.get<{ data: AudioResult[]; total: number }>(
      '/audio',
      {
        params: { page, limit },
      }
    );
    return response.data;
  },
};
