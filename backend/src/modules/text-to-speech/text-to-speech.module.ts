import { Module } from '@nestjs/common';
import { TextToSpeechService } from './text-to-speech.service';
import { TextToSpeechController } from './text-to-speech.controller';

@Module({
  controllers: [TextToSpeechController],
  providers: [TextToSpeechService],
  exports: [TextToSpeechService],
})
export class TextToSpeechModule {}
