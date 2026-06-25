import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../supabase';
import type { ApplicationWithGrant } from './useApplications';
import type { MatchedGrant } from './useGrants';
import type { PaginatedResponse } from '../types/filters';

export interface DashboardData {
  metrics: {
    activeApps: number;
    upcomingDeadlines: number;
    matchesCount: number;
    projectsCount: number;
  };
  inProgressApps: ApplicationWithGrant[];
  topMatches: MatchedGrant[];
  isLoading: boolean;
  isError: boolean;
  errors: {
    projects?: any;
    matches?: any;
    applications?: any;
  };
}

/**
 * Fetch and aggregate dashboard KPI metrics, active pipeline, and top recommendations.
 * Queries matching backend routes in parallel and falls back gracefully on sub-query failures.
 */
export function useDashboardQuery(): DashboardData {
  const { session } = useAuth();
  const token = session?.access_token;

  // 1. Fetch projects count (we only need the total_items metadata from pagination)
  const projectsQuery = useQuery<PaginatedResponse<Project>, Error>({
    queryKey: ['projects', { limit: 1 }, token],
    queryFn: () => apiRequest<PaginatedResponse<Project>>('/org/projects?limit=1', { method: 'GET' }, token),
    enabled: !!token,
  });

  // 2. Fetch matched grants (limit 100 for score calculation and selection)
  const matchesQuery = useQuery<PaginatedResponse<MatchedGrant>, Error>({
    queryKey: ['grant_matches', { is_dismissed: false, limit: 100 }, token],
    queryFn: () => apiRequest<PaginatedResponse<MatchedGrant>>('/grants/matches?is_dismissed=false&limit=100', { method: 'GET' }, token),
    enabled: !!token,
  });

  // 3. Fetch applications (limit 100 for active pipeline list)
  const applicationsQuery = useQuery<PaginatedResponse<ApplicationWithGrant>, Error>({
    queryKey: ['applications', { limit: 100 }, token],
    queryFn: () => apiRequest<PaginatedResponse<ApplicationWithGrant>>('/applications?limit=100', { method: 'GET' }, token),
    enabled: !!token,
  });

  // Consolidate loading states
  const isLoading = 
    (projectsQuery.isLoading && !projectsQuery.data && !projectsQuery.isError) ||
    (matchesQuery.isLoading && !matchesQuery.data && !matchesQuery.isError) ||
    (applicationsQuery.isLoading && !applicationsQuery.data && !applicationsQuery.isError);

  // Dashboard fails fully only if ALL three requests fail
  const isError = projectsQuery.isError && matchesQuery.isError && applicationsQuery.isError;

  // Extract data safely with fallbacks
  const projectsData = projectsQuery.data?.data ?? [];
  const projectsCount = projectsQuery.data?.pagination?.total_items ?? (projectsQuery.isError ? 0 : projectsData.length);

  const matchesList = matchesQuery.data?.data ?? [];
  const matchesCount = matchesQuery.data?.pagination?.total_items ?? (matchesQuery.isError ? 0 : matchesList.length);
  const topMatches = [...matchesList]
    .sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0))
    .slice(0, 3);

  const appsList = applicationsQuery.data?.data ?? [];
  const inProgressApps = appsList.filter(
    (app) => app.status === 'Exploring' || app.status === 'Drafting'
  );

  // Calculate deadlines occurring within the next 14 days
  const upcomingDeadlines = inProgressApps.filter((app) => {
    const deadlineStr = app.grants?.deadline;
    if (!deadlineStr) return false;
    
    const deadlineTime = new Date(deadlineStr).getTime();
    const daysLeft = Math.ceil((deadlineTime - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 14;
  }).length;

  return {
    metrics: {
      activeApps: inProgressApps.length,
      upcomingDeadlines,
      matchesCount,
      projectsCount,
    },
    inProgressApps,
    topMatches,
    isLoading,
    isError,
    errors: {
      projects: projectsQuery.error,
      matches: matchesQuery.error,
      applications: applicationsQuery.error,
    },
  };
}
