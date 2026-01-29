import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { OcrProcessor } from './ocr.processor';
import { OcrWebSocketGateway } from './ocr-websocket.gateway';
import { OcrCacheService } from './ocr-cache.service';
import { OcrResult } from './entities/ocr-result.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OcrResult]),
    BullModule.registerQueue({
      name: 'ocr',
    }),
    forwardRef(() => UploadsModule),
    StorageModule,
  ],
  providers: [OcrService, OcrProcessor, OcrWebSocketGateway, OcrCacheService],
  controllers: [OcrController],
  exports: [OcrService, OcrWebSocketGateway, OcrCacheService],
})
export class OcrModule {}
