import axios from 'axios';

// Direct call to Python Agent (CORS already open on :8000)
// In production, configure nginx to proxy /agent -> python-agent:8000
const agentApi = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:8000'
    : '/agent',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request/Response Types ──────────────────────────────────────

export interface RAGIndexRequest {
  project_path: string;
  doc_content: string;
  force?: boolean;
}

export interface RAGQueryRequest {
  project_path: string;
  question: string;
  api_key?: string;
  model?: string;
  top_k?: number;
}

export interface RAGIndexResponse {
  status: string;
  chunks: number;
  index_file: string;
}

export interface RAGQueryResponse {
  answer: string;
  sources: { source: string; excerpt: string }[];
}

// ── Mount Discovery ──────────────────────────────────────────────

export interface MountInfo {
  mounts: {
    host_hint: string;
    container_path: string;
    projects: { name: string; path: string }[];
  }[];
  hint: string;
}

// ── Service ─────────────────────────────────────────────────────

export const ragService = {
  /** Get available mount points and projects in the Agent container. */
  getMounts: async (): Promise<MountInfo> => {
    const response = await agentApi.get('/api/mounts');
    return response.data;
  },



  /** Index a generated document for RAG Q&A. */
  index: async (data: RAGIndexRequest): Promise<RAGIndexResponse> => {
    const response = await agentApi.post('/api/rag/index', data);
    return response.data;
  },

  /** Ask a question against an indexed document. */
  query: async (data: RAGQueryRequest): Promise<RAGQueryResponse> => {
    const response = await agentApi.post('/api/rag/query', data);
    return response.data;
  },
};
