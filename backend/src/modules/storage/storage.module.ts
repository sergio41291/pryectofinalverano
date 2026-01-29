import { Module } from '@nestjs/common';
import { MinioClientService } from './minio-client.service';
import { StorageService } from './storage.service';

@Module({
  providers: [MinioClientService, StorageService],
  exports: [MinioClientService, StorageService],
})
export class StorageModule {}
