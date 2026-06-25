import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrantMatchesQuery } from '../hooks/useGrants';
import { GrantCard } from '../components/grants/GrantCard';
import { GrantTable } from '../components/grants/GrantTable';
import { 
  Search, 
  LayoutGrid, 
  List, 
  AlertTriangle, 
  Loader2, 
  FileText
} from 'lucide-react';

const CAUSE_AREAS = [
  'All Causes',
  'Education',
  'Healthcare',
  'Environment',
  'Livelihoods',
  'Rural Development',
  'Sanitation',
  'Women Empowerment'
];

export const GrantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCause, setSelectedCause] = useState('All Causes');

  // Queries
  const { data: matchesData, isLoading: matchesLoading, error: matchesError } = useGrantMatchesQuery({
    is_dismissed: false,
    limit: 100, // Fetch up to 100 matches to allow solid filtering
  });

  // Filter logic
  const matches = matchesData?.data ?? [];
  const filteredMatches = matches.filter((m) => {
    const grant = m.grants;
    if (!grant) return false;

    const matchesSearch = 
      grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.funder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCause = 
      selectedCause === 'All Causes' || 
      grant.cause_areas.some(cause => cause.toLowerCase() === selectedCause.toLowerCase());

    return matchesSearch && matchesCause;
  });

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out] relative min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-satoshi text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Find Grants</h1>
          <p className="text-sm font-sans text-zinc-550 dark:text-zinc-400">
            Pre-screened opportunities matching your statutory compliance criteria.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-[8px] bg-zinc-50 dark:bg-zinc-900 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-none border border-zinc-200/50 dark:border-zinc-700/50'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-none border border-zinc-200/50 dark:border-zinc-700/50'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
            title="Table View"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 dark:text-zinc-550" />
          <input
            type="text"
            placeholder="Search matches by funder, keyword, cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-[8px] text-sm font-sans placeholder-zinc-400 dark:placeholder-zinc-550 focus:outline focus:outline-2 focus:outline-moss dark:focus:outline-moss-dark focus:-outline-offset-1 transition-colors"
          />
        </div>

        {/* Cause Area Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {CAUSE_AREAS.map((cause) => (
            <button
              key={cause}
              onClick={() => setSelectedCause(cause)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCause === cause
                  ? 'bg-moss text-white dark:bg-moss-dark'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-750'
              }`}
            >
              {cause}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {matchesLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] space-y-4">
          <Loader2 className="w-8 h-8 text-moss dark:text-moss-dark animate-spin" />
          <div className="text-center">
            <p className="text-sm font-sans font-semibold text-zinc-800 dark:text-zinc-200">Analyzing matched opportunities...</p>
            <p className="text-xs text-zinc-550 dark:text-zinc-450 mt-1 max-w-xs px-4">
              Warming up live production servers. This may take up to 60 seconds if the instance is booting up.
            </p>
          </div>
        </div>
      ) : matchesError ? (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[12px] text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
          <h3 className="font-satoshi text-base font-semibold text-red-900 dark:text-red-400 mb-1">
            Failed to retrieve matched grants
          </h3>
          <p className="text-xs text-red-650 dark:text-red-500 max-w-xs font-sans">
            {(matchesError as any).message || 'The server encountered an error. Please try again.'}
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-16 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="font-satoshi text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
            No matched grants found
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans max-w-xs leading-relaxed">
            Try adjusting your search filters or make sure you have fully configured your organization profile in Settings to generate matches.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMatches.map((m) => (
            <GrantCard
              key={m.id}
              grant={m.grants}
              fitScore={m.fit_score}
              onViewDetails={() => navigate(`/grants/${m.grants.id}`)}
            />
          ))}
        </div>
      ) : (
        <GrantTable
          grants={filteredMatches}
          isMatchedView={true}
          onViewDetails={(grantId) => navigate(`/grants/${grantId}`)}
        />
      )}
    </div>
  );
};

export default GrantsPage;
