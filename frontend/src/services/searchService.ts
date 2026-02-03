import api from './api';

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  mimeType?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  extractedText?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
}

export interface SearchResponse {
  uploads: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
}

export const searchService = {
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('query', filters.query);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.status) params.append('status', filters.status);
    if (filters.mimeType) params.append('mimeType', filters.mimeType);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<SearchResponse>(`/uploads/search?${params.toString()}`);
    return response.data;
  },
};
