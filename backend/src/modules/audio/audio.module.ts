import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AudioService } from './audio.service';
import { AudioController } from './audio.controller';
import { AudioProcessor } from './audio.processor';
import { AudioResult } from './entities/audio-result.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioResult]),
    BullModule.registerQueue({
      name: 'audio',
    }),
    forwardRef(() => UploadsModule),
    AiModule,
    StorageModule,
  ],
  providers: [AudioService, AudioProcessor],
  controllers: [AudioController],
  exports: [AudioService],
})
export class AudioModule {}
