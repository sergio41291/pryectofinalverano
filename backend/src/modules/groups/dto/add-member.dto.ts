import { IsEmail, IsEnum } from 'class-validator';
import { GroupRole } from '../../../entities/group-member.entity';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(GroupRole)
  role: GroupRole;
}
