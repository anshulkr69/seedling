import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectsQuery, useDeleteProjectMutation } from '../hooks/useVault';
import { 
  FolderClosed, 
  Plus, 
  Trash2, 
  Calendar, 
  MapPin, 
  Users, 
  Coins, 
  AlertTriangle,
  BookOpen,
  Milestone
} from 'lucide-react';
import { format } from 'date-fns';

export const VaultPage: React.FC = () => {
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: projectsData, isLoading, error } = useProjectsQuery({ limit: 100 });
  const deleteProjectMutation = useDeleteProjectMutation();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project from the Memory Vault? This action cannot be undone.')) {
      try {
        await deleteProjectMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  // Indian currency formatter
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const projects = projectsData?.data ?? [];

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out] relative min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-satoshi text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Memory Vault</h1>
          <p className="text-sm font-sans text-zinc-550 dark:text-zinc-400">
            Log past projects and institutional outcomes to populate AI proposal generation blocks.
          </p>
        </div>
        <button
          onClick={() => navigate('/vault/new')}
          className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2.5 flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Log New Project</span>
        </button>
      </div>

      {/* Grid Content / Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] p-6 bg-white dark:bg-zinc-900 space-y-4">
              <div className="h-5 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[12px] text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
          <h3 className="font-satoshi text-base font-semibold text-red-900 dark:text-red-400 mb-1">
            Failed to load Memory Vault
          </h3>
          <p className="text-xs text-red-650 dark:text-red-500 max-w-xs font-sans">
            {(error as any).message || 'The server encountered an error. Please try again.'}
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-16 text-center flex flex-col items-center">
          <FolderClosed className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="font-satoshi text-base font-semibold text-zinc-850 dark:text-zinc-250 mb-1">
            Your Memory Vault is empty
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 font-sans max-w-sm mb-6 leading-relaxed">
            Logging past projects build up your organization's memory, which is used to automatically generate evidence sections in new proposals.
          </p>
          <button 
            onClick={() => navigate('/vault/new')}
            className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Log Your First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => {
            const formattedStart = project.start_date
              ? format(new Date(project.start_date), 'MMM yyyy')
              : '';
            const formattedEnd = project.end_date
              ? format(new Date(project.end_date), 'MMM yyyy')
              : '';
            const dateStr = [formattedStart, formattedEnd].filter(Boolean).join(' - ');

            return (
              <div 
                key={project.id}
                onClick={() => navigate(`/vault/${project.id}`)}
                className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150 relative group cursor-pointer"
              >
                <div>
                  {/* Title & Delete Header */}
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-snug">
                      {project.name}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="p-1.5 text-zinc-450 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-[6px] transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Metadata Stats Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs font-sans text-zinc-550 dark:text-zinc-400">
                    {dateStr && (
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-zinc-400" />
                        <span className="tabular-nums">{dateStr}</span>
                      </div>
                    )}
                    {project.geography && (
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-zinc-400" />
                        <span className="truncate">{project.geography}</span>
                      </div>
                    )}
                    {project.beneficiaries_count !== undefined && (
                      <div className="flex items-center space-x-2">
                        <Users size={14} className="text-zinc-400" />
                        <span className="tabular-nums">{project.beneficiaries_count.toLocaleString()} beneficiaries</span>
                      </div>
                    )}
                    {project.budget_used !== undefined && (
                      <div className="flex items-center space-x-2">
                        <Coins size={14} className="text-zinc-400" />
                        <span className="tabular-nums font-semibold">{currencyFormatter.format(project.budget_used)}</span>
                      </div>
                    )}
                  </div>

                  {/* Activities & Outcomes Styled Blocks */}
                  <div className="mt-5 space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                        <Milestone size={12} />
                        <span>Activities Implemented</span>
                      </div>
                      <p className="text-xs font-sans text-zinc-650 dark:text-zinc-400 leading-relaxed font-normal whitespace-pre-line line-clamp-3">
                        {project.activities}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                        <BookOpen size={12} />
                        <span>Key Outcomes & Impact</span>
                      </div>
                      <p className="text-xs font-sans text-zinc-650 dark:text-zinc-400 leading-relaxed font-normal whitespace-pre-line line-clamp-3">
                        {project.outcomes}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VaultPage;
