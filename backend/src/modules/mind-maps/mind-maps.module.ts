import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MindMapsService } from './mind-maps.service';
import { MindMapsController } from './mind-maps.controller';
import { MindMap } from '../../entities/mind-map.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MindMap])],
  controllers: [MindMapsController],
  providers: [MindMapsService],
  exports: [MindMapsService],
})
export class MindMapsModule {}
