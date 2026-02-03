import api from './api';

export interface Category {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sharedWithGroupId?: string;
  sharedWithGroup?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async getOne(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  async assignDocument(categoryId: string, documentId: string): Promise<void> {
    await api.post(`/categories/${categoryId}/documents/${documentId}`);
  },

  async removeDocumentFromCategory(documentId: string): Promise<void> {
    await api.delete(`/categories/documents/${documentId}`);
  },

  async shareWithGroup(categoryId: string, groupId: string): Promise<Category> {
    const response = await api.post<Category>(`/categories/${categoryId}/share-with-group/${groupId}`);
    return response.data;
  },

  async unshareFromGroup(categoryId: string): Promise<Category> {
    const response = await api.delete<Category>(`/categories/${categoryId}/unshare-from-group`);
    return response.data;
  },
};
