export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProcessData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  bpmnXml: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface VersionData {
  id: string;
  processId: string;
  version: number;
  changes: ChangeRecord[];
  snapshot: string;
  authorId: string;
  message?: string;
  createdAt: string;
}

export interface ChangeRecord {
  type: 'add' | 'update' | 'delete';
  elementId: string;
  elementType: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserData;
  accessToken: string;
  refreshToken: string;
}
