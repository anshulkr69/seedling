import React from 'react';
import { format } from 'date-fns';
import type { Grant } from '../../supabase';
import type { MatchedGrant } from '../../hooks/useGrants';
import { ArrowRight, Landmark } from 'lucide-react';

interface GrantTableProps {
  grants: Grant[] | MatchedGrant[];
  isLoading?: boolean;
  isMatchedView?: boolean;
  onViewDetails: (id: string) => void;
}

function isMatched(item: any): item is MatchedGrant {
  return item && typeof item === 'object' && 'fit_score' in item && 'grants' in item;
}

export const GrantTable: React.FC<GrantTableProps> = ({
  grants,
  isLoading = false,
  isMatchedView = false,
  onViewDetails,
}) => {
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  // 1. Loading Skeleton Rows (renders 5 placeholder rows that align with the columns)
  if (isLoading) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 overflow-hidden shadow-none animate-pulse">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/50">
                <th className="py-4 px-6 h-12 w-2/5" />
                {isMatchedView && <th className="py-4 px-6 h-12 w-16" />}
                <th className="py-4 px-6 h-12 w-1/4" />
                <th className="py-4 px-6 h-12 w-1/5" />
                <th className="py-4 px-6 h-12 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/80">
              {[1, 2, 3, 4, 5].map((n) => (
                <tr key={n}>
                  <td className="py-5 px-6 space-y-2">
                    <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  {isMatchedView && (
                    <td className="py-5 px-6">
                      <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    </td>
                  )}
                  <td className="py-5 px-6">
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-5 px-6">
                    <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-5 px-6">
                    <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (grants.length === 0) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-12 text-center flex flex-col items-center">
        <Landmark className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
        <h3 className="font-satoshi text-base font-semibold text-zinc-850 dark:text-zinc-200 mb-1">
          No grants found
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans max-w-xs">
          Try expanding your search query or adjusting your cause filters to see matches.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 overflow-hidden shadow-none transition-colors duration-150">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E8E8E8] dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/50 text-[11px] font-sans font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              <th className="py-4 px-6 font-semibold">Grant & Funder</th>
              {isMatchedView && <th className="py-4 px-6 font-semibold">Fit Score</th>}
              <th className="py-4 px-6 font-semibold">Funding Range</th>
              <th className="py-4 px-6 font-semibold">Deadline</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E8] dark:divide-zinc-800/80">
            {grants.map((item) => {
              const grant = isMatched(item) ? item.grants : item;
              const fitScore = isMatched(item) ? item.fit_score : undefined;

              const formattedMin = currencyFormatter.format(grant.budget_min);
              const formattedMax = currencyFormatter.format(grant.budget_max);
              const formattedDeadline = grant.deadline
                ? format(new Date(grant.deadline), 'dd MMM yyyy')
                : 'No deadline';

              // Score-dependent color badge interpolation
              let fitColor = 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400';
              if (fitScore !== undefined) {
                if (fitScore >= 80) {
                  fitColor = 'bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover';
                } else if (fitScore >= 50) {
                  fitColor = 'bg-[#FEF3E2] text-[#9A5B00] dark:bg-[#BA1A1A]/10 dark:text-[#BA1A1A]';
                }
              }

              return (
                <tr
                  key={item.id}
                  className="font-sans text-sm hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors duration-150"
                >
                  {/* Grant & Funder */}
                  <td className="py-4 px-6 max-w-sm">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-semibold tracking-wider block">
                      {grant.funder}
                    </span>
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200 line-clamp-1">
                      {grant.title}
                    </span>
                  </td>

                  {/* Fit Score Pill (Only Matched View) */}
                  {isMatchedView && (
                    <td className="py-4 px-6">
                      {fitScore !== undefined ? (
                        <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full tabular-nums ${fitColor}`}>
                          {fitScore}% Fit
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  )}

                  {/* Funding Range */}
                  <td className="py-4 px-6 text-zinc-650 dark:text-zinc-450 font-medium tabular-nums">
                    {formattedMin} - {formattedMax}
                  </td>

                  {/* Deadline */}
                  <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {formattedDeadline}
                  </td>

                  {/* Action Link Button */}
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onViewDetails(grant.id)}
                      className="inline-flex items-center space-x-1 border border-[#E8E8E8] dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold uppercase tracking-wider rounded-[6px] px-3 py-1.5 transition-colors duration-150 cursor-pointer"
                    >
                      <span>View</span>
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
  );
};
