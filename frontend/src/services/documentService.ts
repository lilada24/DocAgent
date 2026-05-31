import api from './api';
import type { GenerateRequest, GenerateResponse, TaskStatus, HealthStatus } from '@/types';

export const documentService = {
  generate: async (data: GenerateRequest): Promise<GenerateResponse> => {
    const response = await api.post('/documents/generate', data);
    return response.data;
  },

  getTaskStatus: async (taskId: string): Promise<TaskStatus> => {
    const response = await api.get(`/documents/tasks/${taskId}`);
    return response.data;
  },

  getProjectDocuments: async (projectId: number): Promise<any[]> => {
    const response = await api.get(`/documents/projects/${projectId}/documents`);
    return response.data;
  },

  getDocument: async (projectId: number, docType: string): Promise<any> => {
    const response = await api.get(`/documents/projects/${projectId}/documents/${docType}`);
    return response.data;
  },

  saveDocument: async (projectId: number, docType: string, content: string): Promise<any> => {
    const response = await api.post(`/documents/projects/${projectId}/documents`, {
      docType,
      content,
    });
    return response.data;
  },

  healthCheck: async (): Promise<HealthStatus> => {
    const response = await api.get('/documents/health');
    return response.data;
  },
};