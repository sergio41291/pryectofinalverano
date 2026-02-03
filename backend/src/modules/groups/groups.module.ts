import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../../entities/group.entity';
import { GroupMember } from '../../entities/group-member.entity';
import { User } from '../users/entities/user.entity';
import { Questionnaire } from '../../entities/questionnaire.entity';
import { MindMap } from '../../entities/mind-map.entity';
import { Summary } from '../../entities/summary.entity';
import { Upload } from '../uploads/entities/upload.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, User, Questionnaire, MindMap, Summary, Upload]),
    EmailModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
