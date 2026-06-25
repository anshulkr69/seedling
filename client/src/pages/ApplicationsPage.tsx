import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApplicationsQuery } from '../hooks/useApplications';
import { 
  FileText, 
  Search, 
  ArrowRight, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: appsData, isLoading, error } = useApplicationsQuery({
    limit: 100
  });

  const applications = appsData?.data ?? [];

  // Color mappings for application status badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Exploring':
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
      case 'Drafting':
        return 'bg-[#FEF3E2] text-[#9A5B00] dark:bg-amber-500/10 dark:text-amber-500';
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
      case 'Won':
        return 'bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover';
      case 'Rejected':
        return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400';
      default:
        return 'bg-zinc-100 text-zinc-650';
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Header */}
      <div>
        <h1 className="font-satoshi text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">My Applications</h1>
        <p className="text-sm font-sans text-zinc-550 dark:text-zinc-400">
          Track proposal drafts, checklist compliance, and active pipeline statuses.
        </p>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] space-y-4">
          <Loader2 className="w-8 h-8 text-moss dark:text-moss-dark animate-spin" />
          <span className="text-sm font-sans text-zinc-500 dark:text-zinc-400">Loading applications...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[12px] text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
          <h3 className="font-satoshi text-base font-semibold text-red-900 dark:text-red-400 mb-1">
            Failed to retrieve applications
          </h3>
          <p className="text-xs text-red-650 dark:text-red-500 max-w-xs font-sans">
            {(error as any).message || 'The server encountered an error. Please try again.'}
          </p>
        </div>
      ) : applications.length === 0 ? (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-16 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="font-satoshi text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
            No applications started yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans max-w-xs mb-6 text-center leading-relaxed">
            Select a matched grant from the Finder, open details, and click "Start Application" to initialize a proposal draft.
          </p>
          <Link to="/grants">
            <button className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 flex items-center space-x-1.5 cursor-pointer">
              <Search size={14} />
              <span>Find Matched Grants</span>
            </button>
          </Link>
        </div>
      ) : (
        <div className="border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-[#E8E8E8] dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/50 text-[11px] font-sans font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Grant & Funder</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold">Deadline</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8] dark:divide-zinc-800/80">
                {applications.map((app) => {
                  const grant = app.grants;
                  const deadlineStr = grant?.deadline
                    ? format(new Date(grant.deadline), 'dd MMM yyyy')
                    : 'No deadline';

                  return (
                    <tr 
                      key={app.id}
                      className="font-sans text-sm hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors duration-150"
                    >
                      {/* Grant details */}
                      <td className="py-4 px-6 max-w-sm">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-555 uppercase font-semibold tracking-wider block">
                          {grant?.funder || 'Unknown Funder'}
                        </span>
                        <span className="font-semibold text-zinc-850 dark:text-zinc-200 line-clamp-1">
                          {grant?.title || 'Untitled Grant'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {deadlineStr}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="inline-flex items-center space-x-1 border border-[#E8E8E8] dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold uppercase tracking-wider rounded-[6px] px-3.5 py-1.5 transition-colors duration-150 cursor-pointer"
                        >
                          <span>Workspace</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
