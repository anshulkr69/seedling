import React from 'react';
import { format } from 'date-fns';
import type { Grant } from '../../supabase';
import { Calendar, DollarSign } from 'lucide-react';

interface GrantCardProps {
  grant: Grant;
  fitScore?: number;
  onViewDetails?: (id: string) => void;
}

export const GrantCard: React.FC<GrantCardProps> = ({
  grant,
  fitScore,
  onViewDetails,
}) => {
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

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
    <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[10px] p-6 flex flex-col justify-between hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors duration-150 relative">
      <div className="space-y-4">
        {/* Header (Funder + Fit Score Pill) */}
        <div className="flex justify-between items-start gap-2">
          <span className="font-sans text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
            {grant.funder}
          </span>
          {fitScore !== undefined && (
            <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${fitColor}`}>
              {fitScore}% Fit
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
            {grant.title}
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Funding Amount */}
          <div className="flex items-center space-x-2 text-zinc-550 dark:text-zinc-400 text-xs">
            <DollarSign size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="font-sans tabular-nums">
              {formattedMin} - {formattedMax}
            </span>
          </div>

          {/* Deadline */}
          <div className="flex items-center space-x-2 text-zinc-550 dark:text-zinc-400 text-xs">
            <Calendar size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="font-sans tabular-nums">
              {formattedDeadline}
            </span>
          </div>
        </div>

        {/* Cause Area Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {grant.cause_areas.slice(0, 3).map((cause) => (
            <span
              key={cause}
              className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 text-[10px] font-semibold uppercase px-2.5 py-0.5 tracking-wide"
            >
              {cause}
            </span>
          ))}
          {grant.cause_areas.length > 3 && (
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 text-[10px] font-semibold uppercase px-2 py-0.5">
              +{grant.cause_areas.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center">
        {grant.requires_fcra && (
          <span className="text-[10px] font-sans font-semibold tracking-wide text-amber-text dark:text-amber-500 bg-[#FEF3E2] dark:bg-amber-500/10 px-2 py-0.5 rounded-[4px] uppercase">
            FCRA Required
          </span>
        )}
        {!grant.requires_fcra && <div />}
        
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(grant.id)}
            className="border border-[#E8E8E8] dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold uppercase tracking-wider rounded-[6px] px-3.5 py-2 transition-colors duration-150 cursor-pointer"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};
