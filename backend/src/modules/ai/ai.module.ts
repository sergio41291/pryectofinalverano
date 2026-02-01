import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AudioModule } from '../audio/audio.module';
import { OcrModule } from '../ocr/ocr.module';
import { Summary } from '../../entities/summary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Summary]),
    forwardRef(() => AudioModule),
    forwardRef(() => OcrModule),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
