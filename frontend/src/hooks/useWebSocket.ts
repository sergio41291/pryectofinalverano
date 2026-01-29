import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface OcrNotification {
  uploadId: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
  result?: {
    text: string;
    confidence: number;
    language: string;
  };
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<OcrNotification[]>([]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn('No token found, WebSocket not connected');
      return;
    }

    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Get userId from localStorage (set during login/register)
      const userId = localStorage.getItem('userId');
      if (userId && token) {
        newSocket.emit('authenticate', { userId, token });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('ocr_completed', (data: OcrNotification) => {
      console.log('OCR completed:', data);
      setNotifications((prev) => [...prev, data]);
    });

    newSocket.on('ocr_failed', (data: OcrNotification) => {
      console.log('OCR failed:', data);
      setNotifications((prev) => [...prev, data]);
    });

    newSocket.on('ocr_progress', (data: { uploadId: string; progress: number }) => {
      console.log('OCR progress:', data);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket,
    isConnected,
    notifications,
    clearNotifications,
  };
}
