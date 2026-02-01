import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AudioModule } from '../audio/audio.module';
import { OcrModule } from '../ocr/ocr.module';

@Module({
  imports: [forwardRef(() => AudioModule), forwardRef(() => OcrModule)],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
