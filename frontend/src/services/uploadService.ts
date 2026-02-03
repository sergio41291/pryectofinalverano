import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Upload {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
  extractedText?: string | null;
  categoryId?: string | null;
  sharedBy?: any;
  sharedAt?: string;
  sharePermission?: 'view' | 'edit';
}

export interface UploadResponse {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  fileType: string;
  processingType: string;
  createdAt: string;
}

export interface DocumentShare {
  id: string;
  uploadId: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  permission: 'view' | 'edit';
  sharedAt: string;
  sharedBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  sharedWith?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  upload?: {
    id: string;
    fileName: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    status: string;
  };
}

export interface ShareDocumentDto {
  userEmail: string;
  permission?: 'view' | 'edit';
}

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return { Authorization: `Bearer ${token}` };
};

export const uploadService = {
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadResponse>(`${API_URL}/uploads`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  async deleteUpload(uploadId: string): Promise<void> {
    await axios.delete(`${API_URL}/uploads/${uploadId}`, {
      headers: getAuthHeader(),
    });
  },

  async getUpload(uploadId: string): Promise<Upload> {
    const response = await axios.get<Upload>(`${API_URL}/uploads/${uploadId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getDownloadUrl(uploadId: string): Promise<string> {
    return `${API_URL}/uploads/${uploadId}/download`;
  },

  async shareDocument(uploadId: string, dto: ShareDocumentDto): Promise<DocumentShare> {
    const response = await axios.post<DocumentShare>(
      `${API_URL}/uploads/${uploadId}/share`,
      dto,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  async getDocumentShares(uploadId: string): Promise<DocumentShare[]> {
    const response = await axios.get<DocumentShare[]>(
      `${API_URL}/uploads/${uploadId}/shares`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  async unshareDocument(uploadId: string, shareId: string): Promise<void> {
    await axios.delete(`${API_URL}/uploads/${uploadId}/shares/${shareId}`, {
      headers: getAuthHeader(),
    });
  },

  async getSharedWithMe(page: number = 1, limit: number = 20): Promise<{
    uploads: Upload[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await axios.get(`${API_URL}/uploads/shared-with-me`, {
      headers: getAuthHeader(),
      params: { page, limit },
    });
    return response.data;
  },
};

