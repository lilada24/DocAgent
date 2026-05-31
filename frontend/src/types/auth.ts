export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  expiresIn: number;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}