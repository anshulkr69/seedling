import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardQuery } from '../hooks/useDashboard';
import { useApplicationsRealtime } from '../hooks/useApplications';
import { MetricCards } from '../components/dashboard/MetricCards';
import { FileText, ArrowRight, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const orgName = profile?.name || 'your Organization';
  
  // Implicitly pull dashboard metrics using the token inside the hook
  const { metrics, inProgressApps, topMatches, isLoading, isError } = useDashboardQuery();

  // Scope live updates to the current organization profile ID
  useApplicationsRealtime(profile?.id);

  // 1. Loading State (Skeleton loaders matching cards and panels shapes exactly)
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-9 w-48 bg-bg-hover rounded-[6px]" />
          <div className="h-4 w-64 bg-bg-hover rounded-[6px]" />
        </div>

        {/* Metrics Card Row Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-bg-surface border border-border-base rounded-[10px] p-6 h-[112px] flex flex-col justify-between"
            >
              <div className="h-9 w-12 bg-bg-hover rounded-[6px]" />
              <div className="h-3 w-28 bg-bg-hover/60 rounded-[4px]" />
            </div>
          ))}
        </div>

        {/* Panel Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel skeleton */}
          <div className="lg:col-span-7 space-y-4">
            <div className="h-6 w-32 bg-bg-hover rounded-[6px]" />
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="bg-bg-surface border border-border-base rounded-[10px] p-4 h-[78px] flex items-center justify-between"
                >
                  <div className="space-y-2 flex-1 pr-4">
                    <div className="h-3 w-20 bg-bg-hover/60 rounded-[4px]" />
                    <div className="h-4 w-48 bg-bg-hover rounded-[4px]" />
                  </div>
                  <div className="h-5 w-16 bg-bg-hover rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Right panel skeleton */}
          <div className="lg:col-span-5 space-y-4">
            <div className="h-6 w-44 bg-bg-hover rounded-[6px]" />
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="bg-bg-surface border border-border-base rounded-[10px] p-4 h-[102px] flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="h-3 w-16 bg-bg-hover/60 rounded-[4px]" />
                      <div className="h-4 w-40 bg-bg-hover rounded-[4px]" />
                    </div>
                    <div className="h-5 w-12 bg-bg-hover rounded-full" />
                  </div>
                  <div className="h-4 w-full border-t border-border-base pt-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="border border-red-200 dark:border-red-950/20 bg-red-50 dark:bg-red-950/10 rounded-[10px] p-8 text-center max-w-md mx-auto my-20 flex flex-col items-center">
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mb-3" />
        <h3 className="font-satoshi text-base font-bold text-text-primary mb-1">
          Something went wrong on our end.
        </h3>
        <p className="text-xs text-text-secondary font-sans mb-6">
          We're having trouble loading your dashboard metrics. Please reload or check your connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-moss hover:bg-moss-hover text-[var(--btn-text)] text-xs font-semibold uppercase tracking-wider rounded-[6px] px-5 py-2.5 transition-colors duration-150 cursor-pointer border-0"
        >
          Retry
        </button>
      </div>
    );
  }


  const inProgressAppsList = inProgressApps ?? [];
  const topMatchesList = topMatches ?? [];

  return (
    <div className="space-y-8 animate-[fadeIn_0.20s_ease-out]">
      {/* Top Header */}
      <div>
        <h1 className="font-satoshi text-[40px] font-bold text-text-primary tracking-tight leading-none mb-1">
          Welcome back, {orgName}.
        </h1>
        <p className="text-sm font-sans text-text-secondary font-normal">
          Track and automate your grant applications and institutional memory.
        </p>
      </div>

      {/* KPI metric cards grid */}
      <MetricCards
        activeApps={metrics?.activeApps ?? 0}
        upcomingDeadlines={metrics?.upcomingDeadlines ?? 0}
        matchesCount={metrics?.matchesCount ?? 0}
        projectsCount={metrics?.projectsCount ?? 0}
      />

      {/* Standard Dual Panel Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Pipeline progress */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-satoshi text-lg font-semibold text-text-primary tracking-tight">
              In Progress
            </h2>

            <div className="space-y-3">
              {inProgressAppsList.length === 0 ? (
                <div className="bg-bg-surface border border-border-base rounded-[10px] p-8 text-center flex flex-col items-center">
                  <FileText className="w-8 h-8 text-text-secondary opacity-30 mb-2" />
                  <p className="text-xs text-text-secondary font-sans">No active applications.</p>
                  <Link to="/grants" className="text-xs font-semibold text-moss hover:underline mt-2">
                    Browse Matches →
                  </Link>
                </div>
              ) : (
                inProgressAppsList.map((app) => {
                  if (!app) return null;
                  const deadlineStr = app.grants?.deadline;
                  const daysLeft = deadlineStr
                    ? Math.ceil((new Date(deadlineStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : 0;

                  const checklist = app.compliance_checklist || {};
                  const list = Object.values(checklist);
                  const completedCount = list.filter(Boolean).length;
                  const totalCount = list.length;

                  return (
                    <div
                      key={app.id}
                      className="bg-bg-surface border border-border-base rounded-[10px] p-4 hover:border-text-secondary/50 transition-colors duration-150 flex items-center justify-between"
                    >
                      <div className="space-y-2 flex-1 pr-4">
                        <div>
                          <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider block leading-tight">
                            {app.grants?.funder}
                          </span>
                          <h4 className="font-sans text-sm font-semibold text-text-primary line-clamp-1">
                            {app.grants?.title}
                          </h4>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-bg-hover h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-moss h-full rounded-full transition-all duration-300"
                              style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-sans text-text-secondary font-semibold whitespace-nowrap tabular-nums">
                            {completedCount}/{totalCount} Checklist
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0 pl-2">
                        <div className="flex flex-col items-end space-y-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                              app.status === 'Drafting'
                                ? 'bg-moss-accent text-text-primary border border-border-base'
                                : 'bg-bg-hover text-text-secondary'
                            }`}
                          >
                            {app.status}
                          </span>
                          <span
                            className={`text-[10px] font-semibold tabular-nums ${
                              daysLeft <= 14 && daysLeft > 0
                                ? 'text-amber-600 dark:text-amber-500'
                                : 'text-text-secondary'
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Closed'}
                          </span>
                        </div>

                        <Link
                          to={`/applications/${app.id}`}
                          className="text-xs font-semibold text-moss hover:underline flex items-center space-x-1 transition-colors duration-150"
                        >
                          <span>Continue</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Recommendations */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-satoshi text-lg font-semibold text-text-primary tracking-tight">
                Top Matches for You
              </h2>
              {topMatchesList.length > 0 && (
                <Link
                  to="/grants"
                  className="px-3 py-1 bg-moss-accent text-moss hover:bg-moss-hover hover:text-white rounded-full text-xs font-semibold flex items-center space-x-1 transition-all duration-150 border-0"
                >
                  <span>View All</span>
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {topMatchesList.length === 0 ? (
                <div className="bg-bg-surface border border-border-base rounded-[10px] p-8 text-center">
                  <p className="text-xs text-text-secondary font-sans">No matches computed yet.</p>
                </div>
              ) : (
                topMatchesList.map((m) => {
                  if (!m) return null;
                  const fit = m.fit_score ?? 0;
                  
                  // Score-dependent color badge interpolation
                  let fitColor = 'bg-zinc-50 text-zinc-500 border border-border-base dark:bg-zinc-900/50 dark:text-zinc-400';
                  if (fit >= 80) {
                    fitColor = 'bg-moss-accent text-moss border border-border-base';
                  } else if (fit >= 50) {
                    fitColor = 'bg-[#FEF3E2] text-[#9A5B00] dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200/30';
                  }

                  const deadlineStr = m.grants?.deadline;
                  const formattedDeadline = deadlineStr
                    ? new Date(deadlineStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : 'N/A';

                  return (
                    <div
                      key={m.id || (m.grants?.id ? `match-${m.grants.id}` : Math.random().toString())}
                      className="bg-bg-surface border border-border-base rounded-[10px] p-4 hover:border-text-secondary/50 transition-colors duration-150 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="pr-2">
                          <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider block leading-tight">
                            {m.grants?.funder}
                          </span>
                          <h4 className="font-sans text-sm font-semibold text-text-primary line-clamp-1">
                            {m.grants?.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${fitColor}`}>
                          {fit}% Fit
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border-base">
                        <span className="text-[10px] font-sans text-text-secondary tabular-nums">
                          Deadline: {formattedDeadline}
                        </span>

                        <Link
                          to={`/grants/${m.grants?.id || m.grant_id}`}
                          className="text-xs font-semibold text-moss hover:underline flex items-center space-x-1 transition-colors duration-150"
                        >
                          <span>View Details</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>


          </div>
        </div>
      </div>
  );
};

export default Dashboard;
