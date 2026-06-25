import React, { useEffect, useState, useRef } from 'react';
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
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Generator States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generationStage, setGenerationStage] = useState(0);

  const hasTriggeredRef = useRef(false);

  // Queries
  const { data: application, isLoading, error, refetch } = useApplicationDetailQuery(id);
  const updateAppMutation = useUpdateApplicationMutation();

  // Sync draft content from database when fetched
  useEffect(() => {
    if (application?.draft_content !== undefined) {
      setDraftContent(application.draft_content || '');
    }
  }, [application?.draft_content]);

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
        grant_id: application.grant_id
      }, {
        timeout: 120000 // 120s timeout
      });

      // Refetch details to fetch generated draft content
      const updated = await refetch();
      if (updated.data?.draft_content) {
        setDraftContent(updated.data.draft_content);
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

  // Checkbox Sync
  const handleChecklistChange = async (key: string, checked: boolean) => {
    if (!application) return;
    
    const updatedChecklist = {
      ...application.compliance_checklist,
      [key]: checked
    };

    // Calculate new status: if all items are checked, set status to Drafting, else Exploring
    // Or let the user manually transition status. Let's keep it robust and update the checklist first.
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
          status: 'Drafting' // Auto-advance status to Drafting if they edited
        }
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setSaveStatus('error');
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
    html = html.replace(/^### (.*$)/gim, '<h4 class="font-satoshi text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-5 mb-2 uppercase tracking-wide">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="font-satoshi text-base font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-1">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="font-satoshi text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-8 mb-4">$1</h2>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-900 dark:text-zinc-100">$1</strong>');

    // Lists
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-sm text-zinc-650 dark:text-zinc-450 my-1">$1</li>');

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
      <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[12px] text-center max-w-lg mx-auto mt-10">
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
  const checklist = application.compliance_checklist || {};
  const checklistKeys = Object.keys(checklist);

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Navigation & Header */}
      <div className="flex flex-col space-y-4">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-250 text-xs font-semibold uppercase tracking-wider space-x-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
              Proposal Editor / {grant.funder}
            </span>
            <h1 className="font-satoshi text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
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
              disabled={saveStatus === 'saving'}
              className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2.5 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>Save Draft</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split Page Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Compliance Checklist & Stats (1 col) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Grant Specs Card */}
          <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-5 space-y-4">
            <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Opportunity Specs</h3>
            
            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Funder</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">{grant.funder}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Max Budget</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(grant.budget_max)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Deadline</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                  {grant.deadline ? format(new Date(grant.deadline), 'dd MMM yyyy') : 'No deadline'}
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Checklist Card */}
          <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-5 space-y-4">
            <div>
              <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Compliance Checklist</h3>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Verify and tick compliance parameters prior to submission.</p>
            </div>

            <div className="space-y-3 pt-2">
              {checklistKeys.length > 0 ? (
                checklistKeys.map((key) => (
                  <Checkbox
                    key={key}
                    label={key}
                    checked={checklist[key]}
                    onChange={(e) => handleChecklistChange(key, e.target.checked)}
                  />
                ))
              ) : (
                <p className="text-xs font-sans text-zinc-400 italic">No checklist items defined.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Generator & Editor (3 cols) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* AI Generator Overlay / Progress view */}
          {isGenerating ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] p-12 text-center flex flex-col items-center justify-center space-y-6 min-h-[450px]">
              <div className="relative">
                <Cpu className="w-12 h-12 text-moss dark:text-moss-dark animate-pulse" />
                <Loader2 className="w-6 h-6 text-moss-accent absolute -bottom-1 -right-1 animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1.5">
                  <Sparkles size={16} className="text-moss" />
                  Generating Proposal Draft
                </h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 max-w-md font-sans">
                  The AI drafting engine is synthesizing your organization information and past logged evidence blocks into a structured proposal.
                </p>
              </div>

              {/* Progress Steps list */}
              <div className="w-full max-w-sm text-left border border-zinc-100 dark:border-zinc-800 rounded-[8px] bg-zinc-50 dark:bg-zinc-950/45 p-4 space-y-2.5">
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
                        isDone ? 'text-zinc-400 line-through' : isCurrent ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-400'
                      }`}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : generationError ? (
            <div className="bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[12px] p-8 text-center flex flex-col items-center justify-center space-y-4">
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
            /* Proposal Editor Panel */
            <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] overflow-hidden flex flex-col min-h-[500px]">
              
              {/* Editor Mode Selector Toolbar */}
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
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
                  <button
                    onClick={() => setEditorMode('split')}
                    className={`hidden md:flex px-3 py-1.5 rounded-[6px] text-xs font-semibold items-center space-x-1.5 transition-colors cursor-pointer ${
                      editorMode === 'split'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-150 border border-zinc-200/50 dark:border-zinc-700/50'
                        : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300'
                    }`}
                  >
                    <FileEdit size={13} />
                    <span>Split Panel</span>
                  </button>
                </div>

                {/* Regenerate Trigger */}
                <button
                  onClick={() => {
                    if (window.confirm('Re-generating will call the drafting engine and overwrite your current edits. Are you sure you want to proceed?')) {
                      handleGenerateDraft();
                    }
                  }}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw size={13} />
                  <span>Regenerate Draft</span>
                </button>
              </div>

              {/* Editor Workspace Panel Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-850">
                
                {/* Raw editor text panel */}
                {(editorMode === 'edit' || editorMode === 'split') && (
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Proposal content in Markdown format..."
                    className="w-full h-[600px] p-6 focus:outline-none resize-none font-mono text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-650"
                  />
                )}

                {/* Styled preview output panel */}
                {(editorMode === 'preview' || editorMode === 'split') && (
                  <div 
                    className="w-full h-[600px] p-6 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(draftContent) }}
                  />
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
