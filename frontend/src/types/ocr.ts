export type OcrProgressStep = 'idle' | 'uploading' | 'extracting' | 'generating' | 'completed' | 'error';

export interface OcrProgressState {
  step: OcrProgressStep;
  message: string;
  progress: number;
  summary?: string;
  error?: string;
}
