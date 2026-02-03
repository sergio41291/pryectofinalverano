import api from './api';

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const groupService = {
  async getMyGroups(): Promise<Group[]> {
    const response = await api.get<Group[]>('/groups');
    return response.data;
  },
};
