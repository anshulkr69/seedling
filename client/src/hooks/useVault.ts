import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../supabase';
import type { ProjectFilters, PaginatedResponse } from '../types/filters';

/**
 * Fetch all projects logged in the Memory Vault
 */
export function useProjectsQuery(filters?: ProjectFilters) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<PaginatedResponse<Project>, Error>({
    queryKey: ['projects', filters, token],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const path = queryString ? `/org/projects?${queryString}` : '/org/projects';
      return apiRequest<PaginatedResponse<Project>>(path, { method: 'GET' }, token);
    },
    enabled: !!token,
  });
}

/**
 * Fetch a single project from the Memory Vault
 */
export function useProjectDetailQuery(id: string | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<Project, Error>({
    queryKey: ['projects', 'detail', id, token],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      const response = await apiRequest<{ data: Project }>(`/org/projects/${id}`, { method: 'GET' }, token);
      return response.data;
    },
    enabled: !!id && !!token,
  });
}

/**
 * Log a new project in the Memory Vault
 */
export function useCreateProjectMutation() {
  const { session } = useAuth();
  const token = session?.access_token;
  const queryClient = useQueryClient();

  return useMutation<Project, Error, Omit<Project, 'id' | 'org_id' | 'created_at' | 'updated_at'>>({
    mutationFn: async (body) => {
      const response = await apiRequest<{ data: Project }>(
        '/org/projects',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
        token
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Update a project in the Memory Vault
 */
export function useUpdateProjectMutation() {
  const { session } = useAuth();
  const token = session?.access_token;
  const queryClient = useQueryClient();

  return useMutation<Project, Error, { id: string; body: Partial<Omit<Project, 'id' | 'org_id' | 'created_at' | 'updated_at'>> }>({
    mutationFn: async ({ id, body }) => {
      const response = await apiRequest<{ data: Project }>(
        `/org/projects/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(body),
        },
        token
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Delete a project from the Memory Vault
 */
export function useDeleteProjectMutation() {
  const { session } = useAuth();
  const token = session?.access_token;
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiRequest<void>(`/org/projects/${id}`, { method: 'DELETE' }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
