import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

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
  const [socket, setSocket] = useState<Socket | null>(null);

  // Conectar a Socket.io
  useEffect(() => {
    const newSocket = io(API_CONFIG.apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    console.log(`Conectando a Socket.io en: ${API_CONFIG.apiUrl}`);

    newSocket.on('connect', () => {
      console.log('Socket.io conectado exitosamente');
    });

    newSocket.on('ocr:uploading', (message: WebSocketMessage) => {
      console.log('Evento ocr:uploading recibido');
      handleOcrMessage(message);
    });

    newSocket.on('ocr:extracting', (message: WebSocketMessage) => {
      console.log('Evento ocr:extracting recibido');
      handleOcrMessage(message);
    });

    newSocket.on('ocr:generating', (message: WebSocketMessage) => {
      console.log('Evento ocr:generating recibido');
      handleOcrMessage(message);
    });

    newSocket.on('ocr:completed', (message: WebSocketMessage) => {
      console.log('Evento ocr:completed recibido');
      handleOcrMessage(message);
    });

    newSocket.on('ocr:error', (message: WebSocketMessage) => {
      console.log('Evento ocr:error recibido');
      handleOcrMessage(message);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io desconectado');
    });

    newSocket.on('error', (error) => {
      console.error('Socket.io error:', error);
      setState(prev => ({
        ...prev,
        step: 'error',
        message: 'Error de conexión',
        error: 'No se pudo conectar al servidor'
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
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
    socket
  };
}
