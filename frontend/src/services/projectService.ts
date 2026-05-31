import api from './api';
import type { Project, ProjectRequest } from '@/types';

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: ProjectRequest): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  update: async (id: number, data: ProjectRequest): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  search: async (keyword: string): Promise<Project[]> => {
    const response = await api.get(`/projects/search?keyword=${keyword}`);
    return response.data;
  },
};