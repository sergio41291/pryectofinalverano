import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from './entities/upload.entity';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { StorageModule } from '../storage/storage.module';
import { OcrModule } from '../ocr/ocr.module';
import { AudioModule } from '../audio/audio.module';
import { User } from '../users/entities/user.entity';
import { Group } from '../../entities/group.entity';
import { MindMap } from '../../entities/mind-map.entity';
import { Category } from '../../entities/category.entity';
import { GroupMember } from '../../entities/group-member.entity';
import { DocumentShare } from '../../entities/document-share.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Upload, User, Group, MindMap, Category, GroupMember, DocumentShare]),
    StorageModule,
    forwardRef(() => OcrModule),
    forwardRef(() => AudioModule),
  ],
  providers: [UploadsService],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}
