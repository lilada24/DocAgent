import api from './api';
import type { GenerateRequest, GenerateResponse, TaskStatus, HealthStatus } from '@/types';

export interface UploadResult {
  message: string;
  projectName: string;
  filesCount: number;
  containerPath: string;
  hostPath: string;
}

export const documentService = {
  /** 上传整个项目文件夹到服务器（Docker 可访问的路径） */
  uploadProject: async (files: File[], projectName: string): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('projectName', projectName);
    for (const file of files) {
      formData.append('files', file);
    }
    const response = await api.post('/documents/upload', formData, {
      timeout: 600000, // 上传项目文件夹可能较慢
    });
    return response.data;
  },

  /** 上传文档文件并解析文本 */
  uploadDocs: async (
    files: File[],
    projectId: number,
    onUploadProgress?: (progress: number) => void,
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('projectId', String(projectId));
    for (const file of files) {
      formData.append('files', file);
    }
    const response = await api.post('/documents/upload-docs', formData, {
      timeout: 600000,
      onUploadProgress: (event) => {
        if (onUploadProgress && event.total) {
          onUploadProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  },

  /** 列出已上传文档 */
  listDocs: async (projectId: number): Promise<any[]> => {
    const response = await api.get(`/documents/list-docs`, {
      params: { projectId },
    });
    return response.data;
  },

  /** 删除已上传文档 */
  deleteDoc: async (documentId: number): Promise<any> => {
    const response = await api.delete('/documents/delete-doc', {
      params: { documentId },
    });
    return response.data;
  },

  /** 索引项目文档到向量库 */
  indexDocs: async (projectId: number, force = false): Promise<any> => {
    const response = await api.post('/documents/index-docs', {
      projectId,
      force,
    });
    return response.data;
  },

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