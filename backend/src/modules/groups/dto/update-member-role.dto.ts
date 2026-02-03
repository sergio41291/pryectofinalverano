import { IsEnum } from 'class-validator';
import { GroupRole } from '../../../entities/group-member.entity';

export class UpdateMemberRoleDto {
  @IsEnum(GroupRole)
  role: GroupRole;
}
