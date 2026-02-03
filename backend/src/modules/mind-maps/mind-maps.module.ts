import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MindMapsService } from './mind-maps.service';
import { MindMapsController } from './mind-maps.controller';
import { MindMap } from '../../entities/mind-map.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../../entities/group.entity';
import { Upload } from '../uploads/entities/upload.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MindMap, User, Group, Upload])],
  controllers: [MindMapsController],
  providers: [MindMapsService],
  exports: [MindMapsService],
})
export class MindMapsModule {}
