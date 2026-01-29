import { useEffect, useState, useCallback } from 'react';

export type OcrProgressStep = 'idle' | 'uploading' | 'extracting' | 'generating' | 'completed' | 'error';

export interface OcrProgressState {
  step: OcrProgressStep;
  message: string;
  progress: number;
  summary?: string;
  error?: string;
}

interface WebSocketMessage {
  event: string;
  data: {
    uploadId?: string;
    message?: string;
    progress?: number;
    summary?: string;
    error?: string;
  };
}

export function useOcrProgress() {
  const [state, setState] = useState<OcrProgressState>({
    step: 'idle',
    message: '',
    progress: 0
  });
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Conectar a WebSocket
  useEffect(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ocr`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('OCR WebSocket conectado');
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleOcrMessage(message);
      } catch (err) {
        console.error('Error al parsear WebSocket message:', err);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setState(prev => ({
        ...prev,
        step: 'error',
        message: 'Error de conexión',
        error: 'No se pudo conectar al servidor'
      }));
    };

    socket.onclose = () => {
      console.log('OCR WebSocket desconectado');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const handleOcrMessage = useCallback((message: WebSocketMessage) => {
    const { event, data } = message;

    switch (event) {
      case 'ocr:uploading':
        setState({
          step: 'uploading',
          message: 'Subiendo archivo...',
          progress: 30
        });
        break;

      case 'ocr:extracting':
        setState({
          step: 'extracting',
          message: 'Extrayendo texto del documento...',
          progress: 50
        });
        break;

      case 'ocr:generating':
        setState({
          step: 'generating',
          message: 'Generando resumen con IA...',
          progress: 75
        });
        break;

      case 'ocr:completed':
        setState({
          step: 'completed',
          message: 'Resumen completado',
          progress: 100,
          summary: data.summary
        });
        break;

      case 'ocr:error':
        setState(prev => ({
          ...prev,
          step: 'error',
          message: 'Error al procesar',
          error: data.error || 'Error desconocido'
        }));
        break;

      default:
        console.warn('Evento OCR desconocido:', event);
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      step: 'idle',
      message: '',
      progress: 0
    });
  }, []);

  return {
    state,
    reset,
    ws
  };
}
