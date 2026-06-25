import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApplicationDetailQuery, useUpdateApplicationMutation } from '../hooks/useApplications';
import { axiosInstance } from '../lib/axios';
import { Checkbox } from '../components/Input';
import {
  ArrowLeft,
  Cpu,
  Loader2,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Eye,
  FileEdit
} from 'lucide-react';
import { format } from 'date-fns';

export const ApplicationEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // States
  const [draftContent, setDraftContent] = useState('');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('preview');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');

  // Generator States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generationStage, setGenerationStage] = useState(0);

  const hasTriggeredRef = useRef(false);
  const lastSavedContentRef = useRef('');
  const draftContentRef = useRef('');

  // Queries
  const { data: application, isLoading, error, refetch } = useApplicationDetailQuery(id);
  const updateAppMutation = useUpdateApplicationMutation();

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

  // Keep draftContentRef synchronized with state
  useEffect(() => {
    draftContentRef.current = draftContent;
  }, [draftContent]);

  // Sync draft content from database when fetched
  useEffect(() => {
    if (application?.draft_content !== undefined) {
      setDraftContent(application.draft_content || '');
      lastSavedContentRef.current = application.draft_content || '';
    }
  }, [application?.draft_content]);

  // Auto-save interval every 30 seconds
  useEffect(() => {
    if (!application) return;

    const interval = setInterval(async () => {
      const latestContent = draftContentRef.current;
      if (latestContent !== lastSavedContentRef.current && saveStatus !== 'saving') {
        console.log('[Auto-save] Running scheduled save...');
        setSaveStatus('saving');
        try {
          await updateAppMutation.mutateAsync({
            id: application.id,
            body: { 
              draft_content: latestContent,
              status: application.status === 'Exploring' ? 'Drafting' : application.status
            }
          });
          lastSavedContentRef.current = latestContent;
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
          console.error('[Auto-save] Save failed:', err);
          setSaveStatus('error');
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [application, saveStatus]);

  // Dynamic stages during generation
  const STAGES = [
    'Initializing AI drafting agents...',
    'Analyzing grant eligibility & requirements...',
    'Querying organization institutional profile...',
    'Retrieving historical evidence from Memory Vault...',
    'Synthesizing evidence and aligning with grant objectives...',
    'Writing comprehensive proposal sections (this may take up to 60s)...',
    'Persisting generated draft into public database...'
  ];

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationStage((prev) => {
          if (prev < STAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 5000); // Progress stages every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Core Draft Trigger Handler
  const handleGenerateDraft = async () => {
    if (!application) return;
    
    setIsGenerating(true);
    setGenerationError('');
    setGenerationStage(0);

    try {
      await axiosInstance.post('/engine/draft', {
        grant_id: application.grant_id,
        application_id: application.id
      }, {
        timeout: 120000 // 120s timeout
      });

      // Refetch details to fetch generated draft content
      const updated = await refetch();
      if (updated.data?.draft_content) {
        setDraftContent(updated.data.draft_content);
        lastSavedContentRef.current = updated.data.draft_content;
      }
      setIsGenerating(false);
    } catch (err: any) {
      console.error('Draft generation error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Generation failed. Server could be warming up from cold start.';
      setGenerationError(errMsg);
      setIsGenerating(false);
    }
  };

  // Trigger automatically on mount if draft_content is empty
  useEffect(() => {
    if (isLoading || !application || isGenerating) return;
    
    if (!application.draft_content && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      handleGenerateDraft();
    }
  }, [application, isLoading]);

  // Dynamic fallback compliance checklist based on grant criteria & documents
  const calculatedChecklist = useMemo(() => {
    if (!application || !application.grants) return {};
    const grant = application.grants;
    const dbChecklist = application.compliance_checklist || {};

    const items: Record<string, boolean> = {};

    // Standard compliance attributes
    if (grant.requires_12a_80g) {
      items['12A/80G Registration'] = false;
    }
    if (grant.requires_fcra) {
      items['FCRA Registration'] = false;
    }
    if (grant.requires_ngo_darpan) {
      items['NGO Darpan Registration'] = false;
    }
    if (grant.requires_csr_1) {
      items['CSR-1 Registration'] = false;
    }
    if (grant.requires_audited_financials) {
      items['Audited Financials (3 Years)'] = false;
    }

    // Required documents array from the grant model
    if (Array.isArray(grant.required_documents)) {
      grant.required_documents.forEach((doc: string) => {
        if (doc) {
          items[doc] = false;
        }
      });
    }

    // Fallback default items if none of the above are required to ensure the checklist is never empty
    if (Object.keys(items).length === 0) {
      items['Registration Certificate'] = false;
      items['Proposal Review'] = false;
      items['Budget Details Verified'] = false;
    }

    // Merge in existing check statuses from database
    Object.keys(items).forEach((key) => {
      if (dbChecklist[key] !== undefined) {
        items[key] = !!dbChecklist[key];
      }
    });

    return items;
  }, [application]);

  // Checkbox Sync
  const handleChecklistChange = async (key: string, checked: boolean) => {
    if (!application) return;
    
    const updatedChecklist = {
      ...calculatedChecklist,
      [key]: checked
    };

    try {
      await updateAppMutation.mutateAsync({
        id: application.id,
        body: { compliance_checklist: updatedChecklist }
      });
    } catch (err) {
      console.error('Failed to update checklist:', err);
    }
  };

  // Manual save handler
  const handleSaveDraft = async () => {
    if (!application) return;
    
    setSaveStatus('saving');
    try {
      await updateAppMutation.mutateAsync({
        id: application.id,
        body: { 
          draft_content: draftContent,
          status: application.status === 'Exploring' ? 'Drafting' : application.status
        }
      });
      lastSavedContentRef.current = draftContent;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setSaveStatus('error');
    }
  };

  // Submission handler
  const handleSubmitApplication = async () => {
    if (!application) return;
    
    setSubmitStatus('submitting');
    try {
      await updateAppMutation.mutateAsync({
        id: application.id,
        body: {
          status: 'Submitted',
          submitted_at: new Date().toISOString()
        }
      });
      setSubmitStatus('submitted');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to submit application:', err);
      setSubmitStatus('error');
    }
  };

  // Regex-based simple Markdown parser to enforce design style without third-party dependencies
  const renderMarkdown = (text: string) => {
    if (!text) return '<p class="text-zinc-400 italic">No proposal content generated yet. Write something above or generate a draft.</p>';
    
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="font-satoshi text-sm font-bold text-text-primary mt-5 mb-2 uppercase tracking-wide">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="font-satoshi text-base font-bold text-text-primary mt-6 mb-3 border-b border-border-base pb-1">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="font-satoshi text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-8 mb-4">$1</h2>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-text-primary">$1</strong>');

    // Lists
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-sm text-zinc-650 dark:text-text-secondary my-1">$1</li>');

    // Paragraph structures
    html = html.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        return line;
      }
      return line ? `<p class="text-sm font-sans text-zinc-650 dark:text-zinc-400 my-2.5 leading-relaxed">${line}</p>` : '';
    }).join('\n');

    return html;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 text-moss dark:text-moss-dark animate-spin" />
        <span className="text-sm font-sans text-zinc-500 dark:text-zinc-400">Loading proposal workspace...</span>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[10px] text-center max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
        <h3 className="font-satoshi text-base font-semibold text-red-900 dark:text-red-400 mb-1">
          Proposal workspace error
        </h3>
        <p className="text-xs text-red-650 dark:text-red-500 max-w-xs font-sans mb-4">
          {(error as any)?.message || 'We had trouble loading this application. It may not exist.'}
        </p>
        <Link to="/dashboard">
          <button className="bg-zinc-800 text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 hover:bg-zinc-900 cursor-pointer">
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  const grant = application.grants;
  const checklist = calculatedChecklist;
  const checklistKeys = Object.keys(checklist);
  const allChecked = checklistKeys.length === 0 || checklistKeys.every(key => checklist[key] === true);

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Navigation & Header */}
      <div className="flex flex-col space-y-4">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-text-secondary hover:text-text-primary text-xs font-semibold uppercase tracking-wider space-x-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400 dark:text-text-secondary">
                Proposal Editor / {grant.funder}
              </span>
              <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full ${getStatusColor(application.status)}`}>
                {application.status}
              </span>
            </div>
            <h1 className="font-satoshi text-2xl font-bold text-text-primary tracking-tight leading-snug">
              {grant.title}
            </h1>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {saveStatus === 'saved' && (
              <span className="text-xs text-moss dark:text-moss-dark-hover flex items-center space-x-1.5 font-sans font-semibold">
                <CheckCircle size={14} />
                <span>Saved to database</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-500 flex items-center space-x-1.5 font-sans font-semibold">
                <AlertTriangle size={14} />
                <span>Save failed</span>
              </span>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={saveStatus === 'saving' || application.status === 'Submitted'}
              className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2.5 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>Save Draft</span>
            </button>

            <button
              onClick={handleSubmitApplication}
              disabled={!allChecked || submitStatus === 'submitting' || application.status === 'Submitted'}
              className={`text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2.5 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer transition-colors ${
                application.status === 'Submitted'
                  ? 'bg-blue-600 dark:bg-blue-700'
                  : 'bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-650'
              }`}
            >
              {submitStatus === 'submitting' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              <span>{application.status === 'Submitted' ? 'Submitted' : 'Mark as Submitted'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Opportunity Specs Bar */}
      <div className="bg-bg-surface border border-border-base rounded-[10px] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-secondary">Specs:</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div>
            <span className="text-text-secondary mr-1">Funder:</span>
            <span className="font-semibold text-text-primary">{grant.funder}</span>
          </div>
          <div>
            <span className="text-text-secondary mr-1">Max Budget:</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(grant.budget_max)}
            </span>
          </div>
          <div>
            <span className="text-text-secondary mr-1">Deadline:</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {grant.deadline ? format(new Date(grant.deadline), 'dd MMM yyyy') : 'No deadline'}
            </span>
          </div>
          {grant.requires_fcra && (
            <span className="text-[10px] font-sans font-semibold tracking-wide text-amber-600 bg-[#FEF3E2] dark:bg-amber-500/10 px-2 py-0.5 rounded-[4px] uppercase border border-amber-250/30">
              FCRA Required
            </span>
          )}
          {grant.requires_12a_80g && (
            <span className="text-[10px] font-sans font-semibold tracking-wide text-moss bg-moss-accent px-2 py-0.5 rounded-[4px] uppercase border border-border-base">
              12A/80G Required
            </span>
          )}
        </div>
      </div>

      {/* Main Workspace Area */}
      {isGenerating ? (
        <div className="bg-bg-surface border border-border-base rounded-[10px] p-12 text-center flex flex-col items-center justify-center space-y-6 min-h-[450px]">
          <div className="relative">
            <Cpu className="w-12 h-12 text-moss dark:text-moss-dark animate-pulse" />
            <Loader2 className="w-6 h-6 text-moss-accent absolute -bottom-1 -right-1 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="font-satoshi text-lg font-semibold text-text-primary flex items-center justify-center gap-1.5">
              <Sparkles size={16} className="text-moss" />
              Generating Proposal Draft
            </h3>
            <p className="text-xs text-text-secondary max-w-md font-sans">
              The AI drafting engine is synthesizing your organization information and past logged evidence blocks into a structured proposal.
            </p>
          </div>

          {/* Progress Steps list */}
          <div className="w-full max-w-sm text-left border border-border-base rounded-[8px] bg-bg-page dark:bg-zinc-950/45 p-4 space-y-2.5">
            {STAGES.map((stage, idx) => {
              const isDone = idx < generationStage;
              const isCurrent = idx === generationStage;
              return (
                <div key={idx} className="flex items-center space-x-2.5 text-xs">
                  {isDone ? (
                    <div className="w-4 h-4 rounded-full bg-moss-accent text-moss flex items-center justify-center text-[9px] font-bold">✓</div>
                  ) : isCurrent ? (
                    <Loader2 size={12} className="text-moss animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-200 dark:border-zinc-850 flex items-center justify-center text-[9px] text-zinc-400" />
                  )}
                  <span className={`font-sans ${
                    isDone ? 'text-text-primary' : isCurrent ? 'text-text-primary font-medium' : 'text-zinc-400'
                  }`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : generationError ? (
        <div className="bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[10px] p-8 text-center flex flex-col items-center justify-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <div className="space-y-1">
            <h4 className="font-satoshi text-base font-semibold text-red-900 dark:text-red-400">Proposal Generation Failed</h4>
            <p className="text-xs text-red-650 dark:text-red-500 max-w-md font-sans">{generationError}</p>
          </div>
          <button
            onClick={() => handleGenerateDraft()}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCw size={14} />
            <span>Retry Generation</span>
          </button>
        </div>
      ) : (
        /* Proposal Editor Panel - Internally Split 25% / 75% */
        <div className="bg-bg-surface border border-border-base rounded-[10px] overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Editor Mode Selector Toolbar */}
          <div className="px-4 py-3 border-b border-border-base/80 bg-bg-page/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-sans font-bold text-zinc-500 uppercase tracking-wide mr-2">Workspace view:</span>
              <button
                onClick={() => setEditorMode('edit')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  editorMode === 'edit'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-150 border border-zinc-200/50 dark:border-zinc-700/50'
                    : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300'
                }`}
              >
                <FileEdit size={13} />
                <span>Raw Markdown</span>
              </button>
              <button
                onClick={() => setEditorMode('preview')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  editorMode === 'preview'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-150 border border-zinc-200/50 dark:border-zinc-700/50'
                    : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300'
                }`}
              >
                <Eye size={13} />
                <span>Formatted Preview</span>
              </button>
            </div>

            {/* Regenerate Trigger */}
            <button
              onClick={() => {
                if (window.confirm('Re-generating will call the drafting engine and overwrite your current edits. Are you sure you want to proceed?')) {
                  handleGenerateDraft();
                }
              }}
              disabled={application.status === 'Submitted'}
              className="text-text-secondary hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw size={13} />
              <span>Regenerate Draft</span>
            </button>
          </div>

          {/* Internally split Checklist (25%) / Editor (75%) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border-base bg-bg-surface">
            
            {/* Left Split Pane: Compliance Checklist (25%) */}
            <div className="lg:col-span-1 p-6 space-y-4 bg-bg-page/10 overflow-y-auto h-[650px]">
              <div>
                <h3 className="font-satoshi text-xs font-bold uppercase text-text-secondary tracking-wider">Compliance Checklist</h3>
                <p className="text-[10px] text-text-secondary opacity-85 font-sans mt-0.5">Verify and check compliance parameters prior to submission.</p>
              </div>

              <div className="space-y-3 pt-2">
                {checklistKeys.length > 0 ? (
                  checklistKeys.map((key) => (
                    <Checkbox
                      key={key}
                      label={key}
                      checked={checklist[key]}
                      onChange={(e) => handleChecklistChange(key, e.target.checked)}
                      disabled={application.status === 'Submitted'}
                    />
                  ))
                ) : (
                  <p className="text-xs font-sans text-text-secondary italic">No checklist items defined.</p>
                )}
              </div>

              {checklistKeys.length > 0 && !allChecked && (
                <p className="text-[10px] text-amber-600 dark:text-amber-500 font-sans mt-3 flex items-start gap-1">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>All compliance items must be verified and checked before you can submit.</span>
                </p>
              )}
            </div>

            {/* Right Split Pane: Proposal Editor (75%) */}
            <div className="lg:col-span-3 flex flex-col h-[650px] divide-y divide-zinc-200 dark:divide-zinc-850">
              
              {/* Raw editor text panel */}
              {editorMode === 'edit' && (
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Proposal content in Markdown format..."
                  disabled={application.status === 'Submitted'}
                  className="w-full h-full p-6 focus:outline-none resize-none font-mono text-sm bg-transparent text-text-primary placeholder-zinc-300 dark:placeholder-zinc-650 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              )}

              {/* Styled preview output panel */}
              {editorMode === 'preview' && (
                <div 
                  className="w-full h-full p-6 overflow-y-auto bg-transparent"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(draftContent) }}
                />
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
