import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useProjectDetailQuery, useUpdateProjectMutation } from '../hooks/useVault';
import { Input, Textarea, Toggle, Checkbox } from '../components/Input';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Edit3, 
  Calendar, 
  MapPin, 
  Users, 
  Coins, 
  Milestone, 
  BookOpen, 
  FileCheck, 
  ExternalLink, 
  AlertTriangle 
} from 'lucide-react';
import { z } from 'zod';
import { format } from 'date-fns';

const CAUSE_AREAS = [
  'Education',
  'Healthcare',
  'Environment',
  'Livelihoods',
  'Rural Development',
  'Sanitation',
  'Women Empowerment',
  'Disaster Relief'
];

const DEMOGRAPHICS = [
  'Women',
  'Youth',
  'Children',
  'Farmers',
  'Rural Communities',
  'Urban Poor',
  'Elderly',
  'Persons with Disabilities'
];

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  activities: z.string().min(10, 'Activities description must be at least 10 characters'),
  outcomes: z.string().min(10, 'Outcomes description must be at least 10 characters'),
  geography: z.string().min(2, 'Geography/Location is required'),
  beneficiaries_count: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().nonnegative('Beneficiaries count must be a non-negative integer').optional()
  ),
  budget_used: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Budget used must be a positive number')
  ),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  sdg_alignment: z.array(z.string()).min(1, 'Select at least one cause area / SDG alignment'),
  target_demographics: z.array(z.string()).min(1, 'Select at least one target demographic group'),
  has_utilization_certificate: z.boolean().default(false),
  utilization_certificate_url: z.string().or(z.literal('')).optional(),
}).refine(data => {
  if (data.has_utilization_certificate) {
    if (!data.utilization_certificate_url || data.utilization_certificate_url.trim() === '') {
      return false;
    }
    try {
      new URL(data.utilization_certificate_url);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: 'Valid URL is required when Utilization Certificate is available',
  path: ['utilization_certificate_url'],
});

export const VaultDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: project, isLoading: projectLoading, error: projectError } = useProjectDetailQuery(id);
  const updateProjectMutation = useUpdateProjectMutation();

  const { register, handleSubmit, watch, control, setValue, reset, setError, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      activities: '',
      outcomes: '',
      geography: '',
      beneficiaries_count: '',
      budget_used: '',
      start_date: '',
      end_date: '',
      sdg_alignment: [] as string[],
      target_demographics: [] as string[],
      has_utilization_certificate: false,
      utilization_certificate_url: '',
    }
  });

  const hasUC = watch('has_utilization_certificate');

  // Load existing details when fetched
  useEffect(() => {
    if (project) {
      reset({
        name: project.name || '',
        activities: project.activities || '',
        outcomes: project.outcomes || '',
        geography: project.geography || '',
        beneficiaries_count: project.beneficiaries_count ? String(project.beneficiaries_count) : '',
        budget_used: project.budget_used ? String(project.budget_used) : '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        sdg_alignment: project.sdg_alignment || [],
        target_demographics: project.target_demographics || [],
        has_utilization_certificate: !!project.utilization_certificate_url,
        utilization_certificate_url: project.utilization_certificate_url || '',
      });
    }
  }, [project, reset]);

  const handleCancel = () => {
    setGlobalError(null);
    setIsEditing(false);
    if (project) {
      reset({
        name: project.name || '',
        activities: project.activities || '',
        outcomes: project.outcomes || '',
        geography: project.geography || '',
        beneficiaries_count: project.beneficiaries_count ? String(project.beneficiaries_count) : '',
        budget_used: project.budget_used ? String(project.budget_used) : '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        sdg_alignment: project.sdg_alignment || [],
        target_demographics: project.target_demographics || [],
        has_utilization_certificate: !!project.utilization_certificate_url,
        utilization_certificate_url: project.utilization_certificate_url || '',
      });
    }
  };

  const onSubmit = async (values: any) => {
    if (!id) return;
    setGlobalError(null);
    
    // Validate values using Zod
    const parsed = projectSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as any;
        setError(path, { type: 'manual', message: issue.message });
      });
      setGlobalError('Please resolve the errors highlighted below.');
      return;
    }

    const formatDate = (dateStr: string | undefined | null) => {
      if (!dateStr || dateStr.trim() === '') return undefined;
      const match = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
      if (match) return dateStr;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return undefined;
        return d.toISOString().split('T')[0];
      } catch {
        return undefined;
      }
    };

    try {
      const payload = {
        name: parsed.data.name,
        start_date: formatDate(parsed.data.start_date),
        end_date: formatDate(parsed.data.end_date),
        geography: parsed.data.geography,
        beneficiaries_count: parsed.data.beneficiaries_count,
        activities: parsed.data.activities,
        outcomes: parsed.data.outcomes,
        sdg_alignment: parsed.data.sdg_alignment,
        target_demographics: parsed.data.target_demographics,
        budget_used: parsed.data.budget_used,
        utilization_certificate_url: parsed.data.has_utilization_certificate 
          ? parsed.data.utilization_certificate_url 
          : undefined,
      };

      await updateProjectMutation.mutateAsync({ id, body: payload });
      setIsEditing(false);
    } catch (err: any) {
      setGlobalError(err.message || 'An error occurred while saving the updates.');
    }
  };

  if (projectLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 text-moss dark:text-moss-dark animate-spin" />
        <span className="text-sm font-sans text-zinc-550 dark:text-zinc-400">Fetching project details...</span>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/50 rounded-[12px] text-center max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
        <h3 className="font-satoshi text-base font-semibold text-red-900 dark:text-red-400 mb-1">
          Failed to load Project details
        </h3>
        <p className="text-xs text-red-650 dark:text-red-500 max-w-xs font-sans mb-4">
          {(projectError as any)?.message || 'This project record could not be retrieved.'}
        </p>
        <Link to="/vault">
          <button className="bg-zinc-800 text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 hover:bg-zinc-900 cursor-pointer">
            Back to Memory Vault
          </button>
        </Link>
      </div>
    );
  }

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const formattedStart = project.start_date
    ? (() => {
        try {
          return format(new Date(project.start_date), 'dd MMM yyyy');
        } catch {
          return project.start_date;
        }
      })()
    : 'No start date';

  const formattedEnd = project.end_date
    ? (() => {
        try {
          return format(new Date(project.end_date), 'dd MMM yyyy');
        } catch {
          return project.end_date;
        }
      })()
    : 'No end date';

  const dateStr = [formattedStart, formattedEnd].filter(Boolean).join(' - ');

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Navigation and Actions Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/vault" 
          className="inline-flex items-center text-zinc-450 hover:text-zinc-850 dark:hover:text-zinc-200 text-xs font-semibold uppercase tracking-wider space-x-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Memory Vault</span>
        </Link>

        {/* Edit Toggle Header Actions */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-[6px] cursor-pointer flex items-center space-x-1.5 transition-colors shadow-none"
          >
            <Edit3 size={14} />
            <span>Edit Project</span>
          </button>
        )}
      </div>

      {/* Header Info */}
      {!isEditing && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {project.geography && (
              <span className="inline-flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-450 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-sans">
                <MapPin size={10} />
                <span>{project.geography}</span>
              </span>
            )}
            {dateStr && (
              <span className="inline-flex items-center space-x-1 bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-sans">
                <Calendar size={10} />
                <span className="tabular-nums">{dateStr}</span>
              </span>
            )}
          </div>
          <h1 className="font-satoshi text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
            {project.name}
          </h1>
        </div>
      )}

      {/* Global Validation Error */}
      {isEditing && globalError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/50 rounded-[12px] text-xs text-red-650 dark:text-red-400 font-sans flex items-start space-x-2 animate-[fadeIn_0.15s_ease-out]">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Detail Core Layout Grid */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Header */}
          <div className="flex items-center justify-between bg-zinc-55/5 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-850 rounded-[12px]">
            <div>
              <h3 className="font-satoshi text-sm font-bold text-zinc-800 dark:text-zinc-200">
                You are in Edit Mode
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-sans">
                Modify metrics, activities, and metadata.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs font-sans font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-250 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[6px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProjectMutation.isPending}
                className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer border-0 shadow-none"
              >
                {updateProjectMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left: General Specs & Descriptions (col-span-2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Project Metadata Card */}
              <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-6 space-y-6">
                <Input
                  label="Project Name *"
                  placeholder="e.g. Primary School Digital Literacy Initiative"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Start Date"
                    type="date"
                    error={errors.start_date?.message}
                    {...register('start_date')}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    error={errors.end_date?.message}
                    {...register('end_date')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Total Budget Used (INR) *"
                    type="number"
                    placeholder="e.g. 500000"
                    error={errors.budget_used?.message}
                    {...register('budget_used')}
                  />
                  <Input
                    label="Geography / Location *"
                    placeholder="e.g. Wardha District, Maharashtra"
                    error={errors.geography?.message}
                    {...register('geography')}
                  />
                </div>

                <Input
                  label="Beneficiary Count (Optional)"
                  type="number"
                  placeholder="e.g. 450"
                  error={errors.beneficiaries_count?.message}
                  {...register('beneficiaries_count')}
                />
              </div>

              {/* Narratives Card */}
              <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-6 space-y-6">
                <Textarea
                  label="Activities Implemented *"
                  placeholder="Describe programmatic inputs, infra bought, workshops held..."
                  rows={5}
                  error={errors.activities?.message}
                  {...register('activities')}
                />

                <Textarea
                  label="Key Outcomes & Impact *"
                  placeholder="Describe measurable outputs, training audits, test scores improvements..."
                  rows={5}
                  error={errors.outcomes?.message}
                  {...register('outcomes')}
                />
              </div>
            </div>

            {/* Right: Classifications & Audits (col-span-1) */}
            <div className="space-y-6">
              
              {/* SDG Alignment Checklist */}
              <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-5 space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-zinc-550 tracking-wider">
                    Cause Areas / SDG Alignment *
                  </h3>
                </div>

                <div className="flex flex-col space-y-1">
                  {CAUSE_AREAS.map((cause) => (
                    <Checkbox
                      key={cause}
                      label={cause}
                      value={cause}
                      checked={watch('sdg_alignment')?.includes(cause)}
                      onChange={(e) => {
                        const current = watch('sdg_alignment') || [];
                        if (e.target.checked) {
                          setValue('sdg_alignment', [...current, cause], { shouldValidate: true });
                        } else {
                          setValue('sdg_alignment', current.filter((x: string) => x !== cause), { shouldValidate: true });
                        }
                      }}
                    />
                  ))}
                </div>
                {errors.sdg_alignment && (
                  <span className="text-red-500 text-xs font-sans block mt-1">{errors.sdg_alignment.message}</span>
                )}
              </div>

              {/* Target Demographics Checklist */}
              <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-5 space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-zinc-555 tracking-wider">
                    Target Demographics *
                  </h3>
                </div>

                <div className="flex flex-col space-y-1">
                  {DEMOGRAPHICS.map((demo) => (
                    <Checkbox
                      key={demo}
                      label={demo}
                      value={demo}
                      checked={watch('target_demographics')?.includes(demo)}
                      onChange={(e) => {
                        const current = watch('target_demographics') || [];
                        if (e.target.checked) {
                          setValue('target_demographics', [...current, demo], { shouldValidate: true });
                        } else {
                          setValue('target_demographics', current.filter((x: string) => x !== demo), { shouldValidate: true });
                        }
                      }}
                    />
                  ))}
                </div>
                {errors.target_demographics && (
                  <span className="text-red-500 text-xs font-sans block mt-1">{errors.target_demographics.message}</span>
                )}
              </div>

              {/* Compliance / UC Card */}
              <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-5 space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-zinc-555 tracking-wider">
                    Audit Verification
                  </h3>
                </div>

                <div className="space-y-4">
                  <Controller
                    name="has_utilization_certificate"
                    control={control}
                    render={({ field }) => (
                      <Toggle
                        label="UC Available?"
                        helperText="Is an audited Utilization Certificate file available?"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  {hasUC && (
                    <div className="pt-1 animate-[fadeIn_0.15s_ease-out]">
                      <Input
                        label="Utilization Certificate URL *"
                        placeholder="https://example-ngo.org/doc/uc.pdf"
                        error={errors.utilization_certificate_url?.message}
                        {...register('utilization_certificate_url')}
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Panel: Narrative Descriptions (70%) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Activities Card */}
            <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-6 space-y-4">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5">
                <Milestone size={14} className="text-moss dark:text-moss-dark" />
                <span>Activities Implemented</span>
              </div>
              <p className="text-sm font-sans text-zinc-650 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {project.activities || 'No activities logged.'}
              </p>
            </div>

            {/* Outcomes Card */}
            <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-6 space-y-4">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5">
                <BookOpen size={14} className="text-moss dark:text-moss-dark" />
                <span>Key Outcomes & Impact</span>
              </div>
              <p className="text-sm font-sans text-zinc-650 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {project.outcomes || 'No outcome statements logged.'}
              </p>
            </div>
          </div>

          {/* Right Panel: Metrics, Taxonomy, Compliance (30%) */}
          <div className="space-y-6">
            
            {/* Scope & Budget Metrics */}
            <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-5 space-y-4 font-sans text-xs">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-zinc-555 tracking-wider">
                  Project Scope & Metrics
                </h3>
              </div>
              
              {/* Budget */}
              <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-850 pb-3">
                <div className="flex items-center space-x-2 text-zinc-555">
                  <Coins size={14} className="text-zinc-400" />
                  <span>Budget Utilized</span>
                </div>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 tabular-nums">
                  {project.budget_used ? currencyFormatter.format(project.budget_used) : 'Not specified'}
                </span>
              </div>

              {/* Beneficiaries */}
              <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-855 pb-3">
                <div className="flex items-center space-x-2 text-zinc-555">
                  <Users size={14} className="text-zinc-400" />
                  <span>Beneficiaries Reached</span>
                </div>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 tabular-nums">
                  {project.beneficiaries_count !== undefined && project.beneficiaries_count !== null 
                    ? project.beneficiaries_count.toLocaleString() 
                    : 'Not specified'}
                </span>
              </div>

              {/* Timelines */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-zinc-555">
                  <Calendar size={14} className="text-zinc-400" />
                  <span>Project Duration</span>
                </div>
                <span className="font-semibold text-zinc-850 dark:text-zinc-200 tabular-nums">
                  {dateStr || 'Not specified'}
                </span>
              </div>
            </div>

            {/* SDGs & Taxonomy */}
            <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-5 space-y-4">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-zinc-555 tracking-wider">
                  Alignments & Taxonomies
                </h3>
              </div>

              {/* Cause Areas */}
              <div className="space-y-2.5">
                <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-550 block">Cause Areas</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.sdg_alignment && project.sdg_alignment.length > 0 ? (
                    project.sdg_alignment.map((cause) => (
                      <span
                        key={cause}
                        className="rounded-full bg-moss-accent text-moss dark:bg-moss-dark/10 dark:text-moss-dark-hover text-[10px] font-bold uppercase px-2.5 py-0.5 tracking-wide"
                      >
                        {cause}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-450 italic font-sans">No cause areas logged</span>
                  )}
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-550 block">Target Demographics</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.target_demographics && project.target_demographics.length > 0 ? (
                    project.target_demographics.map((demo) => (
                      <span
                        key={demo}
                        className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 text-[10px] font-semibold uppercase px-2.5 py-0.5 tracking-wide"
                      >
                        {demo}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-450 italic font-sans">No demographic details logged</span>
                  )}
                </div>
              </div>
            </div>

            {/* Compliance / UC Panel */}
            <div className="bg-white dark:bg-zinc-900 border border-[#E8E8E8] dark:border-zinc-800 rounded-[12px] p-5 space-y-4">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <h3 className="font-satoshi text-xs font-bold uppercase text-zinc-400 dark:text-zinc-555 tracking-wider">
                  Verification Records
                </h3>
              </div>

              {project.utilization_certificate_url ? (
                <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 text-zinc-800 dark:text-zinc-250 text-xs">
                    <FileCheck size={18} className="text-moss dark:text-moss-dark shrink-0" />
                    <span className="font-semibold font-sans">Utilization Certificate</span>
                  </div>
                  <a
                    href={project.utilization_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    title="Open Utilization Certificate URL"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <div className="p-4 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl text-center">
                  <span className="text-xs font-sans text-zinc-450 italic">No Utilization Certificate uploaded.</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default VaultDetail;
