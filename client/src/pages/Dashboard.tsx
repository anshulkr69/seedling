import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardQuery } from '../hooks/useDashboard';
import { useApplicationsRealtime } from '../hooks/useApplications';
import { MetricCards } from '../components/dashboard/MetricCards';
import { FileText, ArrowRight, FolderPlus, Compass, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const orgName = profile?.name || 'your Organization';
  
  // Implicitly pull dashboard metrics using the token inside the hook
  const { metrics, inProgressApps, topMatches, isLoading, isError, errors } = useDashboardQuery();

  // Scope live updates to the current organization profile ID
  useApplicationsRealtime(profile?.id);

  // 1. Loading State (Skeleton loaders matching cards and panels shapes exactly)
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-9 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
          <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
        </div>

        {/* Metrics Card Row Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-6 h-[112px] flex flex-col justify-between"
            >
              <div className="h-9 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
              <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-850 rounded-[4px]" />
            </div>
          ))}
        </div>

        {/* Panel Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel skeleton */}
          <div className="lg:col-span-7 space-y-4">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-4 h-[78px] flex items-center justify-between"
                >
                  <div className="space-y-2 flex-1 pr-4">
                    <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-[4px]" />
                    <div className="h-4 w-48 bg-zinc-250 dark:bg-zinc-800 rounded-[4px]" />
                  </div>
                  <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Right panel skeleton */}
          <div className="lg:col-span-5 space-y-4">
            <div className="h-6 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-4 h-[102px] flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-[4px]" />
                      <div className="h-4 w-40 bg-zinc-250 dark:bg-zinc-800 rounded-[4px]" />
                    </div>
                    <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  </div>
                  <div className="h-4 w-full border-t border-zinc-100 dark:border-zinc-800/50 pt-2" />
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
      <div className="border border-red-200 dark:border-red-950/20 bg-red-50 dark:bg-red-950/10 rounded-[12px] p-8 text-center max-w-md mx-auto my-20 flex flex-col items-center">
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mb-3" />
        <h3 className="font-satoshi text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Something went wrong on our end.
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans mb-6">
          We're having trouble loading your dashboard metrics. Please reload or check your connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-5 py-2.5 transition-colors duration-150 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // 3. New User Empty State
  // Spec: Triggered when "Your vault is empty" (projectsCount === 0)
  const isVaultEmpty = (metrics?.projectsCount ?? 0) === 0;

  const inProgressAppsList = inProgressApps ?? [];
  const topMatchesList = topMatches ?? [];

  return (
    <div className="space-y-8 animate-[fadeIn_0.20s_ease-out]">
      {/* Top Header */}
      <div>
        <h1 className="font-satoshi text-[40px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none mb-1">
          Welcome back, {orgName}.
        </h1>
        <p className="text-sm font-sans text-zinc-550 dark:text-zinc-400 font-normal">
          Track and automate your grant applications and institutional memory.
        </p>
      </div>

      {/* Render sub-query error banners if any failed partially */}
      {errors && (errors.projects || errors.matches || errors.applications) && (
        <div className="bg-zinc-100 dark:bg-zinc-850/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-[6px] text-xs text-zinc-650 dark:text-zinc-400 flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-amber-text rounded-full animate-ping shrink-0" />
          <span>Some metrics failed to load and are displaying defaults. We are retrying...</span>
        </div>
      )}

      {/* KPI metric cards grid (Active Apps, Upcoming, Matches, Projects) */}
      <MetricCards
        activeApps={metrics?.activeApps ?? 0}
        upcomingDeadlines={metrics?.upcomingDeadlines ?? 0}
        matchesCount={metrics?.matchesCount ?? 0}
        projectsCount={metrics?.projectsCount ?? 0}
      />

      {isVaultEmpty ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-8 max-w-2xl mx-auto text-center flex flex-col items-center">
          <Compass className="w-10 h-10 text-moss dark:text-moss-dark mb-4" />
          <h3 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Unlock Smarter Matching
          </h3>
          <p className="text-sm font-sans text-zinc-550 dark:text-zinc-400 mb-6 max-w-md leading-relaxed">
            We've found <span className="font-semibold text-moss dark:text-moss-dark-hover tabular-nums">{metrics?.matchesCount ?? 0}</span> grants that match your profile. Start by exploring your top matches.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/grants">
              <button className="bg-moss hover:bg-moss-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-6 py-3 transition-colors duration-150 flex items-center space-x-2 cursor-pointer border-0">
                <span>Browse Matches</span>
                <ArrowRight size={14} />
              </button>
            </Link>
            <Link to="/vault">
              <button className="border border-[#E8E8E8] dark:border-zinc-850 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-900 dark:text-zinc-100 text-xs font-semibold uppercase tracking-wider rounded-[6px] px-6 py-3 transition-colors duration-150 flex items-center space-x-2 cursor-pointer">
                <FolderPlus size={14} />
                <span>Log a Past Project</span>
              </button>
            </Link>
          </div>
        </div>
      ) : (
        /* Standard Dual Panel Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Pipeline progress */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              In Progress
            </h2>

            <div className="space-y-3">
              {inProgressAppsList.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-8 text-center flex flex-col items-center">
                  <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">No active applications.</p>
                  <Link to="/grants" className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline mt-2">
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
                      className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-4 hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors duration-150 flex items-center justify-between"
                    >
                      <div className="space-y-2 flex-1 pr-4">
                        <div>
                          <span className="text-[10px] text-zinc-405 dark:text-zinc-500 uppercase font-semibold tracking-wider block leading-tight">
                            {app.grants?.funder}
                          </span>
                          <h4 className="font-sans text-sm font-semibold text-zinc-850 dark:text-zinc-200 line-clamp-1">
                            {app.grants?.title}
                          </h4>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-zinc-100 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-moss dark:bg-moss-dark h-full rounded-full transition-all duration-300"
                              style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-sans text-zinc-400 dark:text-zinc-500 font-semibold whitespace-nowrap tabular-nums">
                            {completedCount}/{totalCount} Checklist
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0 pl-2">
                        <div className="flex flex-col items-end space-y-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                              app.status === 'Drafting'
                                ? 'bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover'
                                : 'bg-zinc-100 text-zinc-550 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {app.status}
                          </span>
                          <span
                            className={`text-[10px] font-semibold tabular-nums ${
                              daysLeft <= 14 && daysLeft > 0
                                ? 'text-amber-text dark:text-amber-500'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Closed'}
                          </span>
                        </div>

                        <Link
                          to={`/applications/${app.id}`}
                          className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center space-x-1 transition-colors duration-150"
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
            <h2 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Top Matches for You
            </h2>

            <div className="space-y-3">
              {topMatchesList.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-8 text-center">
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 font-sans">No matches computed yet.</p>
                </div>
              ) : (
                topMatchesList.map((m) => {
                  if (!m) return null;
                  const fit = m.fit_score ?? 0;
                  
                  // Score-dependent color badge interpolation
                  let fitColor = 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400';
                  if (fit >= 80) {
                    fitColor = 'bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover';
                  } else if (fit >= 50) {
                    fitColor = 'bg-[#FEF3E2] text-[#9A5B00] dark:bg-[#BA1A1A]/10 dark:text-[#BA1A1A]';
                  }

                  const deadlineStr = m.grants?.deadline;
                  const formattedDeadline = deadlineStr
                    ? new Date(deadlineStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : 'N/A';

                  return (
                    <div
                      key={m.id || (m.grants?.id ? `match-${m.grants.id}` : Math.random().toString())}
                      className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-4 hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors duration-150 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="pr-2">
                          <span className="text-[10px] text-zinc-405 dark:text-zinc-500 uppercase font-semibold tracking-wider block leading-tight">
                            {m.grants?.funder}
                          </span>
                          <h4 className="font-sans text-sm font-semibold text-zinc-850 dark:text-zinc-200 line-clamp-1">
                            {m.grants?.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${fitColor}`}>
                          {fit}% Fit
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                        <span className="text-[10px] font-sans text-zinc-400 dark:text-zinc-500 tabular-nums">
                          Deadline: {formattedDeadline}
                        </span>

                        <Link
                          to="/grants"
                          className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center space-x-1 transition-colors duration-150"
                        >
                          <span>View Grants</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {topMatchesList.length > 0 && (
              <div className="flex justify-end pt-1">
                <Link
                  to="/grants"
                  className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center space-x-1 transition-colors duration-150"
                >
                  <span>View all matched grants</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
