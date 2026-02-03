import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMember, GroupRole } from '../../entities/group-member.entity';
import { REQUIRE_GROUP_ROLE_KEY } from '../decorators/group-role.decorator';

/**
 * Guard to verify user has required role in a group
 * Expects groupId in request params
 */
@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<GroupRole[]>(
      REQUIRE_GROUP_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No role requirement
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.id || request.params.groupId;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!groupId) {
      throw new ForbiddenException('ID de grupo no proporcionado');
    }

    const membership = await this.groupMemberRepository.findOne({
      where: { groupId, userId: user.id },
    });

    if (!membership) {
      throw new NotFoundException('No eres miembro de este grupo');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'No tienes los permisos necesarios en este grupo',
      );
    }

    // Attach membership to request for use in controllers
    request.groupMembership = membership;

    return true;
  }
}
