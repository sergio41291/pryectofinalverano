import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioClientService {
  private readonly logger = new Logger(MinioClientService.name);
  private minioClient: Minio.Client;

  constructor() {
    this.initializeMinioClient();
  }

  private initializeMinioClient(): void {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_HOST || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    this.logger.log(
      `MinIO client initialized: ${process.env.MINIO_HOST}:${process.env.MINIO_PORT}`,
    );
  }

  getClient(): Minio.Client {
    return this.minioClient;
  }

  async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);

      if (!exists) {
        await this.minioClient.makeBucket(bucketName, 'us-east-1');
        this.logger.log(`Bucket created: ${bucketName}`);
      } else {
        this.logger.debug(`Bucket already exists: ${bucketName}`);
      }
    } catch (error: any) {
      this.logger.error(`Error ensuring bucket exists: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async uploadFile(
    bucketName: string,
    objectName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      await this.minioClient.putObject(
        bucketName,
        objectName,
        fileBuffer,
        fileBuffer.length,
        { 'Content-Type': contentType },
      );

      this.logger.log(`File uploaded: ${bucketName}/${objectName}`);
      return objectName; // Return only objectName, not bucketName/objectName
    } catch (error: any) {
      this.logger.error(`Error uploading file: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async downloadFile(bucketName: string, objectName: string): Promise<Buffer> {
    try {
      return await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        this.minioClient.getObject(bucketName, objectName, (error: any, stream: any) => {
          if (error) {
            this.logger.error(`Error getting object: ${error?.message}`, error?.stack);
            return reject(error);
          }

          stream.on('data', (chunk: any) => {
            chunks.push(chunk);
          });

          stream.on('end', () => {
            resolve(Buffer.concat(chunks));
          });

          stream.on('error', (error: any) => {
            this.logger.error(`Error downloading file: ${error?.message}`, error?.stack);
            reject(error);
          });
        });
      });
    } catch (error: any) {
      this.logger.error(`Error downloading file: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucketName, objectName);
      this.logger.log(`File deleted: ${bucketName}/${objectName}`);
    } catch (error: any) {
      this.logger.error(`Error deleting file: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async listFiles(bucketName: string, prefix: string = ''): Promise<Minio.BucketItem[]> {
    try {
      const objectsList: Minio.BucketItem[] = [];
      const stream = this.minioClient.listObjects(bucketName, prefix, true);

      return await new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          objectsList.push(obj);
        });

        stream.on('error', (error: any) => {
          this.logger.error(`Error listing files: ${error?.message}`, error?.stack);
          reject(error);
        });

        stream.on('end', () => {
          resolve(objectsList);
        });
      });
    } catch (error: any) {
      this.logger.error(`Error listing files: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async getFileUrl(
    bucketName: string,
    objectName: string,
    expirySeconds: number = 24 * 60 * 60,
  ): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(
        bucketName,
        objectName,
        expirySeconds,
      );
    } catch (error: any) {
      this.logger.error(`Error generating file URL: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async getUploadUrl(
    bucketName: string,
    objectName: string,
    expirySeconds: number = 24 * 60 * 60,
  ): Promise<string> {
    try {
      return await this.minioClient.presignedPutObject(
        bucketName,
        objectName,
        expirySeconds,
      );
    } catch (error: any) {
      this.logger.error(`Error generating upload URL: ${error?.message}`, error?.stack);
      throw error;
    }
  }
}
