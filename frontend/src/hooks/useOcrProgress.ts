import { useEffect, useState, useCallback, useRef } from 'react';
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
    chunk?: string;
  };
}

// Estado global compartido entre instancias del hook
let globalSocket: Socket | null = null;
let globalState: OcrProgressState = {
  step: 'idle',
  message: '',
  progress: 0
};
let stateListeners: Set<(state: OcrProgressState) => void> = new Set();

const updateGlobalState = (newState: Partial<OcrProgressState>) => {
  globalState = { ...globalState, ...newState };
  stateListeners.forEach(listener => listener(globalState));
};

export function useOcrProgress() {
  const [state, setState] = useState<OcrProgressState>(globalState);
  const socketRef = useRef<Socket | null>(null);
  const isInitializedRef = useRef(false);

  // Conectar a Socket.io (una sola vez globalmente)
  useEffect(() => {
    if (isInitializedRef.current) {
      // Ya inicializado, solo suscribirse a cambios
      const listener = (newState: OcrProgressState) => {
        setState(newState);
      };
      stateListeners.add(listener);
      setState(globalState);

      return () => {
        stateListeners.delete(listener);
      };
    }

    isInitializedRef.current = true;

    // Si ya hay una conexión global, usarla
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      setState(globalState);

      const listener = (newState: OcrProgressState) => {
        setState(newState);
      };
      stateListeners.add(listener);

      return () => {
        stateListeners.delete(listener);
      };
    }

    // Crear nueva conexión
    const newSocket = io(API_CONFIG.apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      if (token && userId) {
        newSocket.emit('authenticate', { token, userId });
      }
    });

    newSocket.on('ocr:uploading', (_message: WebSocketMessage) => {
      updateGlobalState({
        step: 'uploading',
        message: 'Subiendo archivo...',
        progress: 30
      });
    });

    newSocket.on('ocr:extracting', (_message: WebSocketMessage) => {
      updateGlobalState({
        step: 'extracting',
        message: 'Extrayendo texto del documento...',
        progress: 50
      });
    });

    newSocket.on('ocr:generating', (_message: WebSocketMessage) => {
      updateGlobalState({
        step: 'generating',
        message: 'Generando resumen con IA...',
        progress: 75
      });
    });

    newSocket.on('ocr:summary-chunk', (message: WebSocketMessage) => {
      // Acumular chunks de resumen
      const currentSummary = globalState.summary || '';
      const newChunk = message.data.chunk || '';
      updateGlobalState({
        step: 'generating',
        message: 'Generando resumen con IA...',
        progress: 75,
        summary: currentSummary + newChunk
      });
    });

    newSocket.on('ocr:completed', (_message: WebSocketMessage) => {
      updateGlobalState({
        step: 'completed',
        message: 'Resumen completado',
        progress: 100,
        summary: globalState.summary
      });
    });

    newSocket.on('ocr:error', (message: WebSocketMessage) => {
      updateGlobalState({
        step: 'error',
        message: 'Error al procesar',
        error: message.data.error || 'Error desconocido'
      });
    });

    newSocket.on('authenticated', (_response) => {
      // Silent - no log needed
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io desconectado');
    });

    newSocket.on('error', (error) => {
      console.error('Socket.io error:', error);
      updateGlobalState({
        step: 'error',
        message: 'Error de conexión',
        error: 'No se pudo conectar al servidor'
      });
    });

    globalSocket = newSocket;
    socketRef.current = newSocket;

    // Suscribirse a cambios de estado
    const listener = (newState: OcrProgressState) => {
      setState(newState);
    };
    stateListeners.add(listener);

    return () => {
      stateListeners.delete(listener);
    };
  }, []);

  const reset = useCallback(() => {
    updateGlobalState({
      step: 'idle',
      message: '',
      progress: 0,
      summary: undefined,
      error: undefined
    });
  }, []);

  return {
    state,
    reset,
    socket: socketRef.current
  };
}
