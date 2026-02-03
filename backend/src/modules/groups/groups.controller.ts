import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { SubscriptionLimitGuard, SubscriptionLimit, LimitType } from '../../common/guards/subscription-limit.guard';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /**
   * POST /api/groups - Create a new group
   */
  @Post()
  @UseGuards(SubscriptionLimitGuard)
  @SubscriptionLimit(LimitType.GROUP_CREATION)
  async createGroup(@NestRequest() req: Request & { user: any }, @Body() createGroupDto: CreateGroupDto) {
    return await this.groupsService.createGroup(req.user.id, createGroupDto);
  }

  /**
   * GET /api/groups - Get all my groups (paginated)
   */
  @Get()
  async getMyGroups(
    @NestRequest() req: Request & { user: any },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return await this.groupsService.getMyGroups(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  /**
   * GET /api/groups/:id - Get single group details
   */
  @Get(':id')
  async getGroup(@NestRequest() req: Request & { user: any }, @Param('id') groupId: string) {
    return await this.groupsService.getGroup(groupId, req.user.id);
  }

  /**
   * PUT /api/groups/:id - Update group (owner only)
   */
  @Put(':id')
  async updateGroup(
    @NestRequest() req: Request & { user: any },
    @Param('id') groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return await this.groupsService.updateGroup(
      groupId,
      req.user.id,
      updateGroupDto,
    );
  }

  /**
   * DELETE /api/groups/:id - Delete group (owner only)
   */
  @Delete(':id')
  async deleteGroup(@NestRequest() req: Request & { user: any }, @Param('id') groupId: string) {
    await this.groupsService.deleteGroup(groupId, req.user.id);
    return { message: 'Grupo eliminado exitosamente' };
  }

  /**
   * POST /api/groups/:id/members - Add member to group
   */
  @Post(':id/members')
  async addMember(
    @NestRequest() req: Request & { user: any },
    @Param('id') groupId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return await this.groupsService.addMember(
      groupId,
      req.user.id,
      addMemberDto,
    );
  }

  /**
   * PUT /api/groups/:id/members/:userId - Update member role
   */
  @Put(':id/members/:userId')
  async updateMemberRole(
    @NestRequest() req: Request & { user: any },
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    return await this.groupsService.updateMemberRole(
      groupId,
      req.user.id,
      targetUserId,
      updateRoleDto,
    );
  }

  /**
   * DELETE /api/groups/:id/members/:userId - Remove member from group
   */
  @Delete(':id/members/:userId')
  async removeMember(
    @NestRequest() req: Request & { user: any },
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.groupsService.removeMember(groupId, req.user.id, targetUserId);
    return { message: 'Miembro removido exitosamente' };
  }

  /**
   * POST /api/groups/:id/leave - Leave group (members only, owner cannot)
   */
  @Post(':id/leave')
  async leaveGroup(@NestRequest() req: Request & { user: any }, @Param('id') groupId: string) {
    await this.groupsService.leaveGroup(groupId, req.user.id);
    return { message: 'Has abandonado el grupo exitosamente' };
  }

  /**
   * GET /api/groups/:id/questionnaires - Get questionnaires shared in group
   */
  @Get(':id/questionnaires')
  async getGroupQuestionnaires(
    @NestRequest() req: Request & { user: any },
    @Param('id') groupId: string,
  ) {
    return await this.groupsService.getGroupQuestionnaires(groupId, req.user.id);
  }

  /**
   * GET /api/groups/:id/mind-maps - Get mind maps shared in group
   */
  @Get(':id/mind-maps')
  async getGroupMindMaps(
    @NestRequest() req: Request & { user: any },
    @Param('id') groupId: string,
  ) {
    return await this.groupsService.getGroupMindMaps(groupId, req.user.id);
  }

  /**
   * GET /api/groups/:id/summaries - Get summaries shared in group
   */
  @Get(':id/summaries')
  async getGroupSummaries(
    @NestRequest() req: Request & { user: any },
    @Param('id') groupId: string,
  ) {
    return await this.groupsService.getGroupSummaries(groupId, req.user.id);
  }
}
