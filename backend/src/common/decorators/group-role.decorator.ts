import { SetMetadata } from '@nestjs/common';
import { GroupRole } from '../../entities/group-member.entity';

export const REQUIRE_GROUP_ROLE_KEY = 'requireGroupRole';

/**
 * Decorator to specify required group role for an endpoint
 * Usage: @RequireGroupRole(GroupRole.OWNER)
 */
export const RequireGroupRole = (...roles: GroupRole[]) =>
  SetMetadata(REQUIRE_GROUP_ROLE_KEY, roles);
