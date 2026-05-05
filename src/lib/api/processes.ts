import { apiClient } from './client';
import { ProcessData, PaginatedResponse } from '@/types/api';

export interface ListProcessesParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}

export const processesApi = {
  list: (params?: ListProcessesParams) =>
    apiClient.get<PaginatedResponse<ProcessData>>('/processes', params as any),

  get: (id: string) =>
    apiClient.get<ProcessData>(`/processes/${id}`),

  create: (data: { name: string; description?: string; category?: string; tags?: string[]; bpmnXml?: string }) =>
    apiClient.post<ProcessData>('/processes', data),

  update: (id: string, data: Partial<ProcessData>) =>
    apiClient.put<ProcessData>(`/processes/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/processes/${id}`),
};
