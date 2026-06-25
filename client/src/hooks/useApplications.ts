import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import type { Application, Grant } from '../supabase';
import type { ApplicationFilters, PaginatedResponse } from '../types/filters';

export type ApplicationWithGrant = Application & {
  grants: Pick<Grant, 'id' | 'title' | 'funder' | 'deadline' | 'budget_min' | 'budget_max'>;
};

export type ApplicationDetailWithGrant = Application & {
  grants: Grant;
};

/**
 * Fetch all applications for the authenticated organization
 */
export function useApplicationsQuery(filters?: ApplicationFilters) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<PaginatedResponse<ApplicationWithGrant>, Error>({
    queryKey: ['applications', filters, token],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString();
      const path = queryString ? `/applications?${queryString}` : '/applications';
      return apiRequest<PaginatedResponse<ApplicationWithGrant>>(path, { method: 'GET' }, token);
    },
    enabled: !!token,
  });
}

/**
 * Fetch application details by ID
 */
export function useApplicationDetailQuery(id: string | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<ApplicationDetailWithGrant, Error>({
    queryKey: ['applications', 'detail', id, token],
    queryFn: async () => {
      if (!id) throw new Error('Application ID is required');
      const response = await apiRequest<{ data: ApplicationDetailWithGrant }>(
        `/applications/${id}`,
        { method: 'GET' },
        token
      );
      return response.data;
    },
    enabled: !!id && !!token,
  });
}

/**
 * Create a new application for a grant
 */
export function useCreateApplicationMutation() {
  const { session } = useAuth();
  const token = session?.access_token;
  const queryClient = useQueryClient();

  return useMutation<Application, Error, { grant_id: string }>({
    mutationFn: async (body) => {
      const response = await apiRequest<{ data: Application }>(
        '/applications',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
        token
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Update an existing application's details, status, or draft content
 */
export function useUpdateApplicationMutation() {
  const { session } = useAuth();
  const token = session?.access_token;
  const queryClient = useQueryClient();

  return useMutation<
    Application,
    Error,
    { id: string; body: Partial<Omit<Application, 'id' | 'org_id' | 'grant_id' | 'created_at' | 'updated_at'>> }
  >({
    mutationFn: async ({ id, body }) => {
      const response = await apiRequest<{ data: Application }>(
        `/applications/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(body),
        },
        token
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Realtime hook that scopes postgres changes on the applications table
 * to the authenticated organization via row filters.
 */
export function useApplicationsRealtime(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    if (!orgId) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');

    const channel = supabase
      .channel(`applications-org-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          console.log('Realtime change intercepted for organization:', orgId, payload);
          // Invalidate cache
          queryClient.invalidateQueries({ queryKey: ['applications'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (subscribeStatus === 'CLOSED' || subscribeStatus === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [orgId, queryClient]);

  return { status };
}
