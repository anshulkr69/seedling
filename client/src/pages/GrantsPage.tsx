import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrantMatchesQuery } from '../hooks/useGrants';
import { GrantCard } from '../components/grants/GrantCard';
import { GrantTable } from '../components/grants/GrantTable';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
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
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCause, setSelectedCause] = useState('All Causes');
  const [isScanning, setIsScanning] = useState(false);

  // Queries
  const { data: matchesData, isLoading: matchesLoading, error: matchesError } = useGrantMatchesQuery({
    is_dismissed: false,
    limit: 100, // Fetch up to 100 matches to allow solid filtering
  });

  const handleScanMatches = async () => {
    setIsScanning(true);
    try {
      const token = session?.access_token;
      await apiRequest('/engine/match', { method: 'POST' }, token);
      queryClient.invalidateQueries({ queryKey: ['grant_matches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      console.error('Scan matches error:', err);
    } finally {
      setIsScanning(false);
    }
  };

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
          <h1 className="font-satoshi text-3xl font-bold text-text-primary tracking-tight">Find Grants</h1>
          <p className="text-sm font-sans text-text-secondary">
            Pre-screened opportunities matching your statutory compliance criteria.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={handleScanMatches}
            disabled={isScanning}
            className="bg-moss hover:bg-moss-hover text-[var(--btn-text)] text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2.5 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 border-0"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <span>Scan for Matches</span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 border border-border-base p-0.5 rounded-[8px] bg-bg-page">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-bg-surface text-text-primary border border-border-base'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-bg-surface text-text-primary border border-border-base'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 bg-bg-surface border border-border-base rounded-[10px] p-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search matches by funder, keyword, cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border-base bg-bg-surface text-text-primary rounded-[8px] text-sm font-sans placeholder-text-secondary/50 focus:outline focus:outline-2 focus:outline-moss focus:-outline-offset-1 transition-colors"
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
                  ? 'bg-moss text-[var(--btn-text)]'
                  : 'bg-bg-hover text-text-secondary hover:bg-bg-hover/80'
              }`}
            >
              {cause}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {matchesLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-bg-surface border border-border-base rounded-[10px] space-y-4">
          <Loader2 className="w-8 h-8 text-moss animate-spin" />
          <div className="text-center">
            <p className="text-sm font-sans font-semibold text-text-primary">Analyzing matched opportunities...</p>
            <p className="text-xs text-text-secondary mt-1 max-w-xs px-4">
              Warming up live production servers. This may take up to 60 seconds if the instance is booting up.
            </p>
          </div>
        </div>
      ) : matchesError ? (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[10px] text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
          <h3 className="font-satoshi text-base font-semibold text-red-900 dark:text-red-400 mb-1">
            Failed to retrieve matched grants
          </h3>
          <p className="text-xs text-red-650 dark:text-red-500 max-w-xs font-sans">
            {(matchesError as any).message || 'The server encountered an error. Please try again.'}
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="border border-border-base rounded-[10px] bg-bg-surface p-16 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-text-secondary opacity-30 mb-3" />
          <h3 className="font-satoshi text-base font-semibold text-text-primary mb-1">
            No matched grants found
          </h3>
          <p className="text-xs text-text-secondary font-sans max-w-xs leading-relaxed mb-6">
            Try adjusting your search filters or make sure you have fully configured your organization profile in Settings to generate matches.
          </p>
          <button
            onClick={handleScanMatches}
            disabled={isScanning}
            className="bg-moss hover:bg-moss-hover text-[var(--btn-text)] text-xs font-semibold uppercase tracking-wider rounded-[6px] px-5 py-3 transition-colors duration-150 flex items-center space-x-2 cursor-pointer border-0"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning Database...</span>
              </>
            ) : (
              <span>Scan for Matches</span>
            )}
          </button>
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
