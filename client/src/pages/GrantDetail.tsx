import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGrantDetailQuery, useGrantMatchesQuery } from '../hooks/useGrants';
import { useApplicationsQuery, useCreateApplicationMutation } from '../hooks/useApplications';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Calendar, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Building2, 
  FileCheck, 
  MapPin, 
  TrendingUp,
  FileClock,
  ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';

export const GrantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Queries
  const { data: grant, isLoading: grantLoading, error: grantError } = useGrantDetailQuery(id);
  const { data: matchesData } = useGrantMatchesQuery({ is_dismissed: false, limit: 100 });
  const { data: appsData } = useApplicationsQuery({ limit: 100 });
  
  // Mutation
  const startApplicationMutation = useCreateApplicationMutation();

  // Load matches & find matching grant match profile
  const matchRecord = matchesData?.data?.find(m => m.grant_id === id);

  // Check if an application already exists for this grant
  const existingApp = appsData?.data?.find(app => app.grant_id === id);

  const handleAction = async () => {
    if (!id || !grant) return;

    if (existingApp) {
      navigate(`/applications/${existingApp.id}`);
      return;
    }

    try {
      const newApp = await startApplicationMutation.mutateAsync({ grant_id: id });
      if (newApp && newApp.id) {
        navigate(`/applications/${newApp.id}`);
      }
    } catch (err) {
      console.error('Failed to start application:', err);
    }
  };

  if (grantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 text-moss dark:text-moss-dark animate-spin" />
        <span className="text-sm font-sans text-text-secondary">Fetching grant details...</span>
      </div>
    );
  }

  if (grantError || !grant) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[10px] text-center max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
        <h3 className="font-satoshi text-base font-semibold text-red-900 dark:text-red-400 mb-1">
          Failed to load Grant details
        </h3>
        <p className="text-xs text-red-650 dark:text-red-500 max-w-xs font-sans mb-4">
          {(grantError as any)?.message || 'This grant opportunity could not be retrieved.'}
        </p>
        <Link to="/grants">
          <button className="bg-zinc-800 text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 hover:bg-zinc-900 cursor-pointer">
            Back to Find Grants
          </button>
        </Link>
      </div>
    );
  }

  // Format currencies
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const formattedMin = currencyFormatter.format(grant.budget_min);
  const formattedMax = currencyFormatter.format(grant.budget_max);
  const formattedDeadline = grant.deadline
    ? (() => {
        try {
          return format(new Date(grant.deadline), 'dd MMMM yyyy');
        } catch {
          return grant.deadline;
        }
      })()
    : 'No deadline';

  // Check if deadline has passed or closed
  const isDeadlinePassed = grant.deadline ? new Date(grant.deadline).getTime() < Date.now() : false;
  const isClosedOpportunity = !grant.is_active || isDeadlinePassed;

  // Fit score & colors
  const fitScore = matchRecord?.fit_score;
  let fitColor = 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400';
  let fitBarColor = 'bg-zinc-400 dark:bg-zinc-600';
  if (fitScore !== undefined) {
    if (fitScore >= 80) {
      fitColor = 'bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover';
      fitBarColor = 'bg-moss dark:bg-moss-dark';
    } else if (fitScore >= 50) {
      fitColor = 'bg-amber-tint text-amber-text dark:bg-amber-500/10 dark:text-amber-500';
      fitBarColor = 'bg-amber-text dark:bg-amber-500';
    } else {
      fitColor = 'bg-zinc-55/5 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400 border border-border-base/50';
      fitBarColor = 'bg-zinc-400 dark:bg-zinc-600';
    }
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Back Navigation */}
      <div>
        <Link 
          to="/grants" 
          className="inline-flex items-center text-text-secondary hover:text-text-primary text-xs font-semibold uppercase tracking-wider space-x-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Find Grants</span>
        </Link>
      </div>

      {/* Closed Warnings Banner */}
      {isClosedOpportunity && (
        <div className="bg-amber-tint border border-amber-tint dark:bg-amber-500/10 dark:border-amber-500/20 p-4 rounded-[10px] flex items-start space-x-3 text-sm text-amber-text dark:text-amber-500 font-sans animate-[fadeIn_0.2s_ease-out]">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-text dark:text-amber-550" />
          <div>
            <h4 className="font-satoshi font-bold text-sm text-amber-text dark:text-amber-400">
              Opportunity Closed
            </h4>
            <p className="text-xs text-amber-text/90 dark:text-amber-500/90 mt-1 leading-relaxed">
              This grant opportunity is currently marked as inactive or the deadline ({formattedDeadline}) has passed. You may not be able to start a new application.
            </p>
          </div>
        </div>
      )}

      {/* Split Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        
        {/* Left Panel: Grant Title, Funder, Description, Eligibility, Deadline, Funding Range (70%) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header Card: Title and Funder */}
          <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-moss dark:text-moss-dark-hover block mb-1.5">
                {grant.funder}
              </span>
              <h1 className="font-satoshi text-2xl md:text-3xl font-bold text-text-primary tracking-tight leading-snug">
                {grant.title}
              </h1>
            </div>

            {/* Quick Metrics Grid: Deadline & Funding Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-base pt-4 mt-2">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-zinc-55/5 dark:bg-zinc-950 text-zinc-500">
                  <Coins size={18} className="text-moss dark:text-moss-dark" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Funding Range</span>
                  <span className="text-sm font-bold text-text-primary tabular-nums">
                    {formattedMin} - {formattedMax}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-zinc-55/5 dark:bg-zinc-950 text-zinc-500">
                  <Calendar size={18} className="text-moss dark:text-moss-dark" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Application Deadline</span>
                  <span className={`text-sm font-bold tabular-nums ${isDeadlinePassed ? 'text-red-650 dark:text-red-500' : 'text-text-primary'}`}>
                    {formattedDeadline}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description (About the Opportunity) */}
          <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 space-y-4">
            <h3 className="font-satoshi text-base font-semibold text-text-primary">About the Opportunity</h3>
            <p className="text-sm font-sans text-zinc-650 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {grant.description}
            </p>

            {/* Target Cause Tags */}
            {grant.cause_areas && grant.cause_areas.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border-base">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-text-secondary uppercase tracking-wider block">Target Causes</span>
                <div className="flex flex-wrap gap-2">
                  {grant.cause_areas.map((cause) => (
                    <span
                      key={cause}
                      className="rounded-full bg-moss-accent text-moss dark:bg-moss-dark/10 dark:text-moss-dark-hover text-[10px] font-bold uppercase px-3 py-1 tracking-wider font-sans"
                    >
                      {cause}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Eligibility Criteria */}
          <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 space-y-5">
            <h3 className="font-satoshi text-base font-semibold text-text-primary">Eligibility Criteria</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="bg-bg-page dark:bg-zinc-950 p-4 rounded-[10px] border border-zinc-200/40 dark:border-zinc-850">
                <div className="flex items-center space-x-1.5 text-text-secondary font-semibold uppercase text-[10px] tracking-wide mb-1">
                  <Building2 size={13} className="text-zinc-400" />
                  <span>Eligible Legal Entities</span>
                </div>
                <span className="text-text-primary font-medium block">
                  {grant.eligible_legal_entities?.join(', ') || 'Any legal registration'}
                </span>
              </div>

              <div className="bg-bg-page dark:bg-zinc-950 p-4 rounded-[10px] border border-zinc-200/40 dark:border-zinc-850">
                <div className="flex items-center space-x-1.5 text-text-secondary font-semibold uppercase text-[10px] tracking-wide mb-1">
                  <Building2 size={13} className="text-zinc-400" />
                  <span>Eligible Organization Types</span>
                </div>
                <span className="text-zinc-855 dark:text-zinc-200 font-medium block">
                  {grant.eligible_org_types?.join(', ') || 'All Organization Types'}
                </span>
              </div>

              <div className="bg-bg-page dark:bg-zinc-950 p-4 rounded-[10px] border border-zinc-200/40 dark:border-zinc-850">
                <div className="flex items-center space-x-1.5 text-text-secondary font-semibold uppercase text-[10px] tracking-wide mb-1">
                  <TrendingUp size={13} className="text-zinc-400" />
                  <span>Minimum Turnover Range</span>
                </div>
                <span className="text-zinc-855 dark:text-zinc-200 font-medium block">
                  {grant.min_turnover_range ? `${grant.min_turnover_range} Annual Turnover` : 'No turnover minimum'}
                </span>
              </div>

              <div className="bg-bg-page dark:bg-zinc-950 p-4 rounded-[10px] border border-zinc-200/40 dark:border-zinc-850">
                <div className="flex items-center space-x-1.5 text-text-secondary font-semibold uppercase text-[10px] tracking-wide mb-1">
                  <MapPin size={13} className="text-zinc-400" />
                  <span>Geography of Impact</span>
                </div>
                <span className="text-zinc-855 dark:text-zinc-200 font-medium block">{grant.geography}</span>
              </div>

              <div className="bg-bg-page dark:bg-zinc-950 p-4 rounded-[10px] border border-zinc-200/40 dark:border-zinc-850 md:col-span-2">
                <div className="flex items-center space-x-1.5 text-text-secondary font-semibold uppercase text-[10px] tracking-wide mb-1">
                  <FileCheck size={13} className="text-zinc-400" />
                  <span>Funding Type Offered</span>
                </div>
                <span className="text-zinc-855 dark:text-zinc-200 font-medium block">
                  {grant.funding_type_offered?.join(', ') || 'Financial Support'}
                </span>
              </div>
            </div>
          </div>

          {/* Required Documents / Annexures */}
          {grant.required_documents && grant.required_documents.length > 0 && (
            <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 space-y-3">
              <h3 className="font-satoshi text-base font-semibold text-text-primary">Required Documents & Annexures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {grant.required_documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 rounded-lg border border-border-base px-3.5 py-2.5 bg-bg-page/20 dark:bg-zinc-900 text-xs text-zinc-650 dark:text-zinc-350 font-sans font-medium"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-moss dark:bg-moss-dark shrink-0" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Fit Score Breakdown, Compliance Badges, Start Application CTA (30%) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Fit Score breakdown */}
          {fitScore !== undefined ? (
            <div className="bg-bg-surface border border-border-base rounded-[10px] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-text-secondary tracking-wider">Fit Score Analysis</h3>
                <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full tabular-nums ${fitColor}`}>
                  {fitScore}% Match
                </span>
              </div>

              {/* Progress bar visual */}
              <div className="h-1.5 w-full bg-bg-hover rounded-full overflow-hidden">
                <div 
                  className={`h-full ${fitBarColor} transition-all duration-500`}
                  style={{ width: `${fitScore}%` }}
                />
              </div>

              {/* Strengths */}
              {matchRecord?.match_reasons?.reasons && matchRecord.match_reasons.reasons.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <span className="text-[9px] font-sans font-bold text-zinc-400 dark:text-text-secondary uppercase tracking-wider block">Key Strengths</span>
                  <ul className="space-y-2">
                    {matchRecord.match_reasons.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start text-xs text-zinc-650 dark:text-zinc-400 font-sans leading-relaxed">
                        <CheckCircle2 size={13} className="text-moss dark:text-moss-dark shrink-0 mr-2 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advisories */}
              {matchRecord?.match_reasons?.advisories && matchRecord.match_reasons.advisories.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-border-base">
                  <span className="text-[9px] font-sans font-bold text-zinc-400 dark:text-text-secondary uppercase tracking-wider block">Advisories</span>
                  <ul className="space-y-2">
                    {matchRecord.match_reasons.advisories.map((adv, idx) => (
                      <li key={idx} className="flex items-start text-xs text-amber-700 dark:text-amber-500 font-sans leading-relaxed">
                        <AlertTriangle size={13} className="text-amber-550 shrink-0 mr-2 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-bg-surface border border-border-base rounded-[10px] p-5 text-center">
              <h3 className="font-satoshi text-xs font-bold uppercase text-text-secondary tracking-wider mb-2">Fit Score Analysis</h3>
              <p className="text-xs font-sans text-text-secondary italic leading-relaxed">
                No matching profile found to analyze fit.
              </p>
            </div>
          )}

          {/* Statutory Compliance badges (12A/80G, FCRA status) */}
          <div className="bg-bg-surface border border-border-base rounded-[10px] p-5 space-y-4">
            <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-text-secondary tracking-wider">Statutory Compliance</h3>
            
            <div className="divide-y divide-zinc-100 dark:divide-zinc-850 border border-zinc-200/50 dark:border-zinc-800 rounded-[8px] overflow-hidden text-xs">
              
              {/* 12A/80G status badge */}
              <div className="p-3 flex justify-between items-center bg-bg-page/20 dark:bg-zinc-950/20">
                <div>
                  <span className="font-sans font-semibold text-text-primary block">12A & 80G Status</span>
                  <span className="text-[9px] text-text-secondary dark:text-zinc-500 uppercase block tracking-wider font-semibold">
                    {grant.requires_12a_80g ? 'Required' : 'Optional'}
                  </span>
                </div>
                <div>
                  {grant.requires_12a_80g ? (
                    profile?.has_12a_80g ? (
                      <span className="bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Eligible</span>
                    ) : (
                      <span className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Missing</span>
                    )
                  ) : (
                    <span className="bg-bg-hover text-zinc-500 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Compliant</span>
                  )}
                </div>
              </div>

              {/* FCRA status badge */}
              <div className="p-3 flex justify-between items-center bg-bg-page/20 dark:bg-zinc-950/20">
                <div>
                  <span className="font-sans font-semibold text-text-primary block">FCRA Compliance</span>
                  <span className="text-[9px] text-text-secondary dark:text-zinc-500 uppercase block tracking-wider font-semibold">
                    {grant.requires_fcra ? 'Required' : 'Optional'}
                  </span>
                </div>
                <div>
                  {grant.requires_fcra ? (
                    profile?.has_fcra ? (
                      <span className="bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Eligible</span>
                    ) : (
                      <span className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Missing</span>
                    )
                  ) : (
                    <span className="bg-bg-hover text-zinc-500 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Compliant</span>
                  )}
                </div>
              </div>

              {/* Audited Financials badge */}
              <div className="p-3 flex justify-between items-center bg-bg-page/20 dark:bg-zinc-950/20">
                <div>
                  <span className="font-sans font-semibold text-text-primary block">Audited Financials</span>
                  <span className="text-[9px] text-text-secondary dark:text-zinc-500 uppercase block tracking-wider font-semibold">
                    {grant.requires_audited_financials ? 'Required' : 'Optional'}
                  </span>
                </div>
                <div>
                  {grant.requires_audited_financials ? (
                    profile?.has_audited_financials ? (
                      <span className="bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Eligible</span>
                    ) : (
                      <span className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Missing</span>
                    )
                  ) : (
                    <span className="bg-bg-hover text-zinc-500 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Compliant</span>
                  )}
                </div>
              </div>

              {/* NGO Darpan status badge */}
              <div className="p-3 flex justify-between items-center bg-bg-page/20 dark:bg-zinc-950/20">
                <div>
                  <span className="font-sans font-semibold text-text-primary block">NGO Darpan ID</span>
                  <span className="text-[9px] text-text-secondary dark:text-zinc-500 uppercase block tracking-wider font-semibold">
                    {grant.requires_ngo_darpan ? 'Required' : 'Optional'}
                  </span>
                </div>
                <div>
                  {grant.requires_ngo_darpan ? (
                    profile?.ngo_darpan_id ? (
                      <span className="bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Eligible</span>
                    ) : (
                      <span className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Missing</span>
                    )
                  ) : (
                    <span className="bg-bg-hover text-zinc-500 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Compliant</span>
                  )}
                </div>
              </div>

              {/* CSR-1 registration status badge */}
              <div className="p-3 flex justify-between items-center bg-bg-page/20 dark:bg-zinc-950/20">
                <div>
                  <span className="font-sans font-semibold text-text-primary block">CSR-1 Registration</span>
                  <span className="text-[9px] text-text-secondary dark:text-zinc-500 uppercase block tracking-wider font-semibold">
                    {grant.requires_csr_1 ? 'Required' : 'Optional'}
                  </span>
                </div>
                <div>
                  {grant.requires_csr_1 ? (
                    profile?.csr_1_registration ? (
                      <span className="bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Eligible</span>
                    ) : (
                      <span className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Missing</span>
                    )
                  ) : (
                    <span className="bg-bg-hover text-zinc-500 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wide">Compliant</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Action CTA Button */}
          <button
            onClick={handleAction}
            disabled={isClosedOpportunity && !existingApp || startApplicationMutation.isPending}
            className="w-full bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] py-4 flex items-center justify-center space-x-1.5 transition-colors duration-150 disabled:opacity-40 cursor-pointer border-0 shadow-none"
          >
            {startApplicationMutation.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Creating Workspace...</span>
              </>
            ) : existingApp ? (
              <>
                <FileClock size={15} />
                <span>Go to Application Draft</span>
              </>
            ) : isClosedOpportunity ? (
              <>
                <ShieldAlert size={15} />
                <span>Application Closed</span>
              </>
            ) : (
              <span>Start Application</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrantDetail;

