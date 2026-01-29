import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Upload {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface OcrResult {
  id: string;
  uploadId: string;
  rawText: string;
  confidence: number;
  language: string;
  processedAt: string;
}

// Auth Service
export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.accessToken) {
      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.accessToken) {
      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },
};

// Upload Service
export const uploadService = {
  async uploadFile(file: File): Promise<Upload> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Upload>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async listUploads(page = 1, limit = 10): Promise<{ data: Upload[]; total: number }> {
    const response = await api.get<{ data: Upload[]; total: number }>('/uploads', {
      params: { page, limit },
    });
    return response.data;
  },

  async getUpload(id: string): Promise<Upload> {
    const response = await api.get<Upload>(`/uploads/${id}`);
    return response.data;
  },

  async deleteUpload(id: string): Promise<void> {
    await api.delete(`/uploads/${id}`);
  },
};

// OCR Service
export const ocrService = {
  async processOcr(uploadId: string, language = 'es'): Promise<{ jobId: string }> {
    const response = await api.post<{ jobId: string }>(`/ocr/${uploadId}/process`, {
      language,
    });
    return response.data;
  },

  async getOcrResult(uploadId: string): Promise<OcrResult> {
    const response = await api.get<OcrResult>(`/ocr/${uploadId}`);
    return response.data;
  },

  async getOcrResultById(id: string): Promise<OcrResult> {
    const response = await api.get<OcrResult>(`/ocr/results/${id}`);
    return response.data;
  },

  async listOcrResults(page = 1, limit = 10): Promise<{ data: OcrResult[]; total: number }> {
    const response = await api.get<{ data: OcrResult[]; total: number }>('/ocr', {
      params: { page, limit },
    });
    return response.data;
  },
};

export default api;
