export interface Project {
  id: number;
  name: string;
  path: string;
  language: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequest {
  name: string;
  path: string;
  language?: string;
  description?: string;
}

export interface Document {
  id: number;
  projectId: number;
  docType: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSummary {
  id: number;
  docType: string;
  version: number;
  updatedAt: string;
  preview: string;
}

export interface GenerateRequest {
  projectPath: string;
  docType?: string;
  language?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  projectName?: string;
}

export interface GenerateResponse {
  taskId: string;
  status: string;
  message: string;
  createdAt: string;
}

export interface TaskStatus {
  taskId: string;
  status: string;
  progress: number;
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  projectId: number;
  docCount: number;
  docTypes: string[];
  lastUpdated: string;
}

export interface HealthStatus {
  backend: string;
  agent: string;
}