import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Grant, GrantMatch } from '../supabase';
import type { GrantFilters, PaginatedResponse } from '../types/filters';

export type MatchedGrant = GrantMatch & { grants: Grant };

/**
 * Fetch all active grants based on filter parameters
 */
export function useGrantsQuery(filters: GrantFilters) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<PaginatedResponse<Grant>, Error>({
    queryKey: ['grants', filters, token],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.cause) params.append('cause', filters.cause);
      if (filters.funder) params.append('funder', filters.funder);
      if (filters.deadline_before) params.append('deadline_before', filters.deadline_before);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);

      const queryString = params.toString();
      const path = queryString ? `/grants?${queryString}` : '/grants';
      return apiRequest<PaginatedResponse<Grant>>(path, { method: 'GET' }, token);
    },
    enabled: !!token,
  });
}

/**
 * Fetch a single grant by ID
 */
export function useGrantDetailQuery(id: string | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<Grant, Error>({
    queryKey: ['grants', 'detail', id, token],
    queryFn: async () => {
      if (!id) throw new Error('Grant ID is required');
      const response = await apiRequest<{ data: Grant }>(`/grants/${id}`, { method: 'GET' }, token);
      return response.data;
    },
    enabled: !!id && !!token,
  });
}

/**
 * Fetch matched grants for the organization
 */
export function useGrantMatchesQuery(
  filters?: { page?: number; limit?: number; is_dismissed?: boolean; min_score?: number }
) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<PaginatedResponse<MatchedGrant>, Error>({
    queryKey: ['grant_matches', filters, token],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.is_dismissed !== undefined) params.append('is_dismissed', filters.is_dismissed.toString());
      if (filters?.min_score !== undefined) params.append('min_score', filters.min_score.toString());

      const queryString = params.toString();
      const path = queryString ? `/grants/matches?${queryString}` : '/grants/matches';
      return apiRequest<PaginatedResponse<MatchedGrant>>(path, { method: 'GET' }, token);
    },
    enabled: !!token,
  });
}

/**
 * Toggle the dismiss state of a matched grant
 */
export function useDismissMatchMutation() {
  const { session } = useAuth();
  const token = session?.access_token;
  const queryClient = useQueryClient();

  return useMutation<GrantMatch, Error, string>({
    mutationFn: async (matchId: string) => {
      const response = await apiRequest<{ data: GrantMatch }>(
        `/grants/matches/${matchId}/dismiss`,
        { method: 'PATCH' },
        token
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grant_matches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
