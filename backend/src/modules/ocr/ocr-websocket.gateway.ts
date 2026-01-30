import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
@Injectable()
export class OcrWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(OcrWebSocketGateway.name);
  private userConnections: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove user connection
    this.userConnections.forEach((socketIds) => {
      socketIds.delete(client.id);
    });
  }

  @SubscribeMessage('authenticate')
  handleAuth(client: Socket, data: { userId: string; token: string }) {
    try {
      // In production, validate the token here
      const { userId } = data;

      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }

      this.userConnections.get(userId)?.add(client.id);
      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} authenticated with socket ${client.id}`);
      client.emit('authenticated', { success: true });
    } catch (error: any) {
      this.logger.error(`Auth error: ${error?.message}`);
      client.emit('authenticated', { success: false, error: error?.message });
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong');
  }

  /**
   * Broadcast OCR completion event to a specific user
   */
  notifyOcrCompleted(userId: string, ocrResult: any) {
    this.server.to(`user:${userId}`).emit('ocr_completed', {
      type: 'ocr_completed',
      uploadId: ocrResult.uploadId,
      ocrResultId: ocrResult.id,
      status: ocrResult.status,
      extractedText: ocrResult.extractedText,
      metadata: ocrResult.metadata,
      completedAt: ocrResult.completedAt,
    });

    this.logger.log(`OCR completed notification sent to user: ${userId}`);
  }

  /**
   * Broadcast OCR failure event to a specific user
   */
  notifyOcrFailed(userId: string, uploadId: string, errorMessage: string) {
    this.server.to(`user:${userId}`).emit('ocr_failed', {
      type: 'ocr_failed',
      uploadId,
      errorMessage,
      timestamp: new Date(),
    });

    this.logger.log(`OCR failed notification sent to user: ${userId}`);
  }

  /**
   * Broadcast OCR progress update
   */
  notifyOcrProgress(userId: string, uploadId: string, progress: number) {
    this.server.to(`user:${userId}`).emit('ocr_progress', {
      type: 'ocr_progress',
      uploadId,
      progress, // 0-100
      timestamp: new Date(),
    });
  }

  /**
   * Notify user that file is being extracted
   */
  notifyExtracting(userId: string, uploadId: string) {
    this.server.to(`user:${userId}`).emit('ocr:extracting', {
      event: 'ocr:extracting',
      data: {
        uploadId,
        message: 'Extrayendo texto del documento...',
        progress: 50,
      },
    });

    this.logger.log(`OCR extracting notification sent to user: ${userId}`);
  }

  /**
   * Notify user that summary is being generated
   */
  notifyGenerating(userId: string, uploadId: string) {
    this.server.to(`user:${userId}`).emit('ocr:generating', {
      event: 'ocr:generating',
      data: {
        uploadId,
        message: 'Generando resumen con IA...',
        progress: 75,
      },
    });

    this.logger.log(`OCR generating notification sent to user: ${userId}`);
  }

  /**
   * Notify user that upload started
   */
  notifyUploading(userId: string, uploadId: string) {
    this.server.to(`user:${userId}`).emit('ocr:uploading', {
      event: 'ocr:uploading',
      data: {
        uploadId,
        message: 'Subiendo archivo...',
        progress: 30,
      },
    });

    this.logger.log(`OCR uploading notification sent to user: ${userId}`);
  }

  /**
   * Notify user that process is complete with summary
   */
  notifyOcrCompletedWithSummary(userId: string, uploadId: string, ocrResult: any, summary: string) {
    this.server.to(`user:${userId}`).emit('ocr:completed', {
      event: 'ocr:completed',
      data: {
        uploadId,
        ocrResultId: ocrResult.id,
        message: 'Resumen completado',
        progress: 100,
        summary,
        extractedText: ocrResult.extractedText,
        metadata: ocrResult.metadata,
        completedAt: ocrResult.completedAt,
      },
    });

    this.logger.log(`OCR completed with summary notification sent to user: ${userId}`);
  }

  /**
   * Notify user of a summary chunk (streaming)
   */
  notifyResumChunk(userId: string, uploadId: string, chunk: string) {
    this.server.to(`user:${userId}`).emit('ocr:summary-chunk', {
      event: 'ocr:summary-chunk',
      data: {
        uploadId,
        chunk,
      },
    });
  }

  /**
   * Notify error with summary
   */
  notifyOcrErrorWithSummary(userId: string, uploadId: string, errorMessage: string) {
    this.server.to(`user:${userId}`).emit('ocr:error', {
      event: 'ocr:error',
      data: {
        uploadId,
        error: errorMessage,
        timestamp: new Date(),
      },
    });

    this.logger.log(`OCR error notification sent to user: ${userId}`);
  }
}
