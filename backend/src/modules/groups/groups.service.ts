import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../../entities/group.entity';
import { GroupMember, GroupRole } from '../../entities/group-member.entity';
import { User } from '../users/entities/user.entity';
import { Questionnaire } from '../../entities/questionnaire.entity';
import { MindMap } from '../../entities/mind-map.entity';
import { Summary } from '../../entities/summary.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Questionnaire)
    private questionnaireRepository: Repository<Questionnaire>,
    @InjectRepository(MindMap)
    private mindMapRepository: Repository<MindMap>,
    @InjectRepository(Summary)
    private summaryRepository: Repository<Summary>,
  ) {}

  /**
   * Validate subscription limits for groups
   * FREE: 0 groups, PRO: unlimited groups (5 members max), BUSINESS: unlimited
   */
  private async validateGroupCreationLimit(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // If user is FREE plan, cannot create groups
    if (user.plan === 'free') {
      throw new ForbiddenException(
        'Los grupos están disponibles solo para planes PRO y ENTERPRISE',
      );
    }

    // PRO and ENTERPRISE have unlimited groups, so no need to check count
  }

  /**
   * Validate member limit for group (PRO: 5 members max, ENTERPRISE: unlimited)
   */
  private async validateMemberLimit(groupId: string): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['owner', 'members'],
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const owner = group.owner;
    if (owner.plan === 'pro') {
      const memberCount = group.members.length;
      if (memberCount >= 5) {
        throw new ForbiddenException(
          'El plan PRO permite máximo 5 miembros por grupo',
        );
      }
    }
    // ENTERPRISE has unlimited members, no check needed
  }

  /**
   * Check if user has required role in group
   */
  private async checkUserRole(
    groupId: string,
    userId: string,
    requiredRoles: GroupRole[],
  ): Promise<GroupMember> {
    const membership = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('No eres miembro de este grupo');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }

    return membership;
  }

  /**
   * Create a new group
   */
  async createGroup(userId: string, createGroupDto: CreateGroupDto) {
    await this.validateGroupCreationLimit(userId);

    const group = this.groupRepository.create({
      ...createGroupDto,
      ownerId: userId,
    });
    const savedGroup = await this.groupRepository.save(group);

    // Add owner as group member
    const ownerMember = this.groupMemberRepository.create({
      groupId: savedGroup.id,
      userId: userId,
      role: GroupRole.OWNER,
    });
    await this.groupMemberRepository.save(ownerMember);

    return this.getGroup(savedGroup.id, userId);
  }

  /**
   * Get all groups for a user (paginated)
   */
  async getMyGroups(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ groups: Group[]; total: number; page: number; limit: number }> {
    const [groups, total] = await this.groupRepository
      .createQueryBuilder('group')
      .innerJoin('group.members', 'member')
      .where('member.userId = :userId', { userId })
      .leftJoinAndSelect('group.owner', 'owner')
      .leftJoinAndSelect('group.members', 'allMembers')
      .leftJoinAndSelect('allMembers.user', 'memberUser')
      .orderBy('group.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { groups, total, page, limit };
  }

  /**
   * Get single group with members
   */
  async getGroup(groupId: string, userId: string): Promise<Group> {
    // Verify user is member
    await this.checkUserRole(groupId, userId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
      GroupRole.MEMBER,
    ]);

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    return group;
  }

  /**
   * Update group details (owner only)
   */
  async updateGroup(
    groupId: string,
    userId: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    await this.checkUserRole(groupId, userId, [GroupRole.OWNER]);

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    Object.assign(group, updateGroupDto);
    await this.groupRepository.save(group);

    return this.getGroup(groupId, userId);
  }

  /**
   * Delete group (owner only)
   */
  async deleteGroup(groupId: string, userId: string): Promise<void> {
    await this.checkUserRole(groupId, userId, [GroupRole.OWNER]);

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    await this.groupRepository.remove(group);
  }

  /**
   * Add member to group (owner and admin can invite)
   */
  async addMember(
    groupId: string,
    userId: string,
    addMemberDto: AddMemberDto,
  ): Promise<GroupMember> {
    await this.checkUserRole(groupId, userId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);
    await this.validateMemberLimit(groupId);

    // Find user by email
    const newUser = await this.userRepository.findOne({
      where: { email: addMemberDto.email },
    });

    if (!newUser) {
      throw new NotFoundException(
        'Usuario con este email no encontrado en el sistema',
      );
    }

    // Check if already a member
    const existingMember = await this.groupMemberRepository.findOne({
      where: { groupId, userId: newUser.id },
    });

    if (existingMember) {
      throw new BadRequestException('Este usuario ya es miembro del grupo');
    }

    // Cannot assign OWNER role
    if (addMemberDto.role === GroupRole.OWNER) {
      throw new BadRequestException('No se puede asignar el rol OWNER');
    }

    const member = this.groupMemberRepository.create({
      groupId,
      userId: newUser.id,
      role: addMemberDto.role,
    });

    return await this.groupMemberRepository.save(member);
  }

  /**
   * Update member role (owner and admin can change roles)
   */
  async updateMemberRole(
    groupId: string,
    userId: string,
    targetUserId: string,
    updateRoleDto: UpdateMemberRoleDto,
  ): Promise<GroupMember> {
    const requesterMembership = await this.checkUserRole(groupId, userId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);

    // Cannot change own role
    if (userId === targetUserId) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }

    const targetMember = await this.groupMemberRepository.findOne({
      where: { groupId, userId: targetUserId },
    });

    if (!targetMember) {
      throw new NotFoundException('Miembro no encontrado en el grupo');
    }

    // Cannot change owner role
    if (targetMember.role === GroupRole.OWNER) {
      throw new BadRequestException('No se puede cambiar el rol del dueño');
    }

    // Cannot assign OWNER role
    if (updateRoleDto.role === GroupRole.OWNER) {
      throw new BadRequestException('No se puede asignar el rol OWNER');
    }

    // Only owner can promote to admin
    if (
      updateRoleDto.role === GroupRole.ADMIN &&
      requesterMembership.role !== GroupRole.OWNER
    ) {
      throw new ForbiddenException('Solo el dueño puede promover a ADMIN');
    }

    targetMember.role = updateRoleDto.role;
    return await this.groupMemberRepository.save(targetMember);
  }

  /**
   * Remove member from group (owner and admin can remove)
   */
  async removeMember(
    groupId: string,
    userId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.checkUserRole(groupId, userId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);

    const targetMember = await this.groupMemberRepository.findOne({
      where: { groupId, userId: targetUserId },
    });

    if (!targetMember) {
      throw new NotFoundException('Miembro no encontrado en el grupo');
    }

    // Cannot remove owner
    if (targetMember.role === GroupRole.OWNER) {
      throw new BadRequestException('No se puede remover al dueño del grupo');
    }

    // Cannot remove self
    if (userId === targetUserId) {
      throw new BadRequestException(
        'No puedes removerte a ti mismo. Usa la función de abandonar grupo',
      );
    }

    await this.groupMemberRepository.remove(targetMember);
  }

  /**
   * Leave group (members can leave, except owner)
   */
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const membership = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });

    if (!membership) {
      throw new NotFoundException('No eres miembro de este grupo');
    }

    if (membership.role === GroupRole.OWNER) {
      throw new BadRequestException(
        'El dueño no puede abandonar el grupo. Debes eliminarlo o transferir la propiedad',
      );
    }

    await this.groupMemberRepository.remove(membership);
  }

  /**
   * Get all questionnaires shared with a group
   */
  async getGroupQuestionnaires(groupId: string, userId: string): Promise<Questionnaire[]> {
    // Check if user is member of the group
    await this.checkUserRole(groupId, userId, [GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER]);

    return this.questionnaireRepository.find({
      where: { groupId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all mind maps shared with a group
   */
  async getGroupMindMaps(groupId: string, userId: string): Promise<MindMap[]> {
    // Check if user is member of the group
    await this.checkUserRole(groupId, userId, [GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER]);

    return this.mindMapRepository.find({
      where: { groupId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all summaries shared with a group
   */
  async getGroupSummaries(groupId: string, userId: string): Promise<Summary[]> {
    // Check if user is member of the group
    await this.checkUserRole(groupId, userId, [GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER]);

    return this.summaryRepository.find({
      where: { groupId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
