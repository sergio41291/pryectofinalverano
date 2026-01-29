import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { OcrProcessor } from './ocr.processor';
import { OcrResult } from './entities/ocr-result.entity';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OcrResult]),
    BullModule.registerQueue({
      name: 'ocr',
    }),
    UploadsModule,
  ],
  providers: [OcrService, OcrProcessor],
  controllers: [OcrController],
  exports: [OcrService],
})
export class OcrModule {}
