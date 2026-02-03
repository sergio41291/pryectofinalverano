import api from './api';

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  permissions?: string[];
  joinedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateGroupDto {
  name: string;
  description?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
}

export interface AddMemberDto {
  email: string;
  role: 'admin' | 'member';
}

export interface UpdateMemberRoleDto {
  role: 'admin' | 'member';
}

export interface GetGroupsResponse {
  groups: Group[];
  total: number;
  page: number;
  limit: number;
}

const groupsService = {
  // Crear nuevo grupo
  async createGroup(data: CreateGroupDto): Promise<Group> {
    const response = await api.post<Group>('/groups', data);
    return response.data;
  },

  // Obtener mis grupos (paginado)
  async getMyGroups(page: number = 1, limit: number = 10): Promise<GetGroupsResponse> {
    const response = await api.get<GetGroupsResponse>('/groups', {
      params: { page, limit },
    });
    return response.data;
  },

  // Obtener un grupo específico
  async getGroup(groupId: string): Promise<Group> {
    const response = await api.get<Group>(`/groups/${groupId}`);
    return response.data;
  },

  // Actualizar grupo (solo owner)
  async updateGroup(groupId: string, data: UpdateGroupDto): Promise<Group> {
    const response = await api.put<Group>(`/groups/${groupId}`, data);
    return response.data;
  },

  // Eliminar grupo (solo owner)
  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}`);
  },

  // Agregar miembro al grupo (owner/admin)
  async addMember(groupId: string, data: AddMemberDto): Promise<GroupMember> {
    const response = await api.post<GroupMember>(`/groups/${groupId}/members`, data);
    return response.data;
  },

  // Actualizar rol de miembro (owner/admin)
  async updateMemberRole(
    groupId: string,
    userId: string,
    data: UpdateMemberRoleDto
  ): Promise<GroupMember> {
    const response = await api.put<GroupMember>(
      `/groups/${groupId}/members/${userId}`,
      data
    );
    return response.data;
  },

  // Remover miembro del grupo (owner/admin)
  async removeMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },

  // Abandonar grupo (members/admin, no owner)
  async leaveGroup(groupId: string): Promise<void> {
    await api.post(`/groups/${groupId}/leave`);
  },

  // Obtener cuestionarios del grupo
  async getGroupQuestionnaires(groupId: string): Promise<any[]> {
    const response = await api.get(`/groups/${groupId}/questionnaires`);
    return response.data;
  },
  // Obtener mapas mentales del grupo
  async getGroupMindMaps(groupId: string): Promise<any[]> {
    const response = await api.get(`/groups/${groupId}/mind-maps`);
    return response.data;
  },
  // Obtener resúmenes del grupo
  async getGroupSummaries(groupId: string): Promise<any[]> {
    const response = await api.get(`/groups/${groupId}/summaries`);
    return response.data;
  }
};

export default groupsService;
