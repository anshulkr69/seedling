import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useCreateProjectMutation } from '../hooks/useVault';
import { Input, Textarea, Toggle, Checkbox } from '../components/Input';
import { ArrowLeft, Loader2, Save, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

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
  }
  return true;
}, {
  message: 'Utilization Certificate file is required when available',
  path: ['utilization_certificate_url'],
});

export const VaultNew: React.FC = () => {
  const navigate = useNavigate();
  const createProjectMutation = useCreateProjectMutation();
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploaded' | 'error'>('idle');
  const [fileName, setFileName] = useState('');

  const handleUCUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploading(true);
    setUploadStatus('idle');
    const filePath = `${profile.id}/${file.name}`;

    try {
      const { error } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      setUploadStatus('uploaded');
      setFileName(file.name);
      setValue('utilization_certificate_url', filePath, { shouldValidate: true });
    } catch (err: any) {
      console.error('UC upload failed:', err);
      setUploadStatus('error');
      alert(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const { register, handleSubmit, watch, control, setValue, setError, formState: { errors } } = useForm({
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

  const onSubmit = async (values: any) => {
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

      const result = await createProjectMutation.mutateAsync(payload);
      if (result && result.id) {
        navigate(`/vault/${result.id}`);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'An error occurred while saving the project.');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Back button */}
      <div>
        <Link 
          to="/vault" 
          className="inline-flex items-center text-text-secondary hover:text-text-primary text-xs font-semibold uppercase tracking-wider space-x-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Memory Vault</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-satoshi text-2xl md:text-3xl font-bold text-text-primary tracking-tight leading-none">
          Log Past Project
        </h1>
        <p className="text-sm font-sans text-text-secondary mt-2">
          Detail your NGO's programmatic history to populate evidence sections in automated AI grant proposals.
        </p>
      </div>

      {/* Global Validation Alert */}
      {globalError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/50 rounded-[10px] text-xs text-red-650 dark:text-red-400 font-sans flex items-start space-x-2 animate-[fadeIn_0.15s_ease-out]">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Project Logger Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Section 1: Basic Info */}
        <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 space-y-6">
          <div className="border-b border-border-base pb-3">
            <h3 className="font-satoshi text-base font-bold text-text-primary">
              Project Identification & Scope
            </h3>
            <p className="text-xs text-text-secondary mt-1 font-sans">
              Enter names, geographies, and timelines associated with the initiative.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Project Name *"
              placeholder="e.g., Primary School Digital Literacy Initative"
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
                placeholder="e.g., 500000"
                error={errors.budget_used?.message}
                {...register('budget_used')}
              />
              <Input
                label="Geography / Location *"
                placeholder="e.g., Wardha District, Maharashtra"
                error={errors.geography?.message}
                {...register('geography')}
              />
            </div>

            <Input
              label="Beneficiary Count (Optional)"
              type="number"
              placeholder="e.g., 450"
              error={errors.beneficiaries_count?.message}
              {...register('beneficiaries_count')}
            />
          </div>
        </div>

        {/* Section 2: Narrative & Impact */}
        <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 space-y-6">
          <div className="border-b border-border-base pb-3">
            <h3 className="font-satoshi text-base font-bold text-text-primary">
              Programmatic Activities & Impact
            </h3>
            <p className="text-xs text-text-secondary mt-1 font-sans">
              Narrate exactly how funds were deployed and what measurable changes occurred.
            </p>
          </div>

          <div className="space-y-6">
            <Textarea
              label="Activities Implemented *"
              placeholder="Detail the actions undertaken (e.g. 'Procured 15 laptops, trained 3 local instructors, held 60 literacy workshops for girls...')"
              rows={4}
              error={errors.activities?.message}
              {...register('activities')}
            />

            <Textarea
              label="Key Outcomes & Impact *"
              placeholder="Detail the measurable impact observed (e.g. '120 female students passed certified computer literacy audits, test scores improved by 22%...')"
              rows={4}
              error={errors.outcomes?.message}
              {...register('outcomes')}
            />
          </div>
        </div>

        {/* Section 3: Cause Areas and Target Demographics */}
        <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cause Areas */}
            <div className="space-y-4">
              <div className="border-b border-border-base pb-2">
                <h3 className="font-satoshi text-base font-bold text-text-primary">
                  Cause Areas / SDG Alignment *
                </h3>
                <p className="text-[11px] text-text-secondary font-sans mt-0.5">
                  Select matching category blocks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
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

            {/* Target Demographics */}
            <div className="space-y-4">
              <div className="border-b border-border-base pb-2">
                <h3 className="font-satoshi text-base font-bold text-text-primary">
                  Target Demographics *
                </h3>
                <p className="text-[11px] text-text-secondary font-sans mt-0.5">
                  Identify groups supported by the project.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
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
          </div>
        </div>

        {/* Section 4: Utilization Audit */}
        <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 space-y-6">
          <div className="border-b border-border-base pb-3">
            <h3 className="font-satoshi text-base font-bold text-text-primary">
              Audit & Verification
            </h3>
            <p className="text-xs text-text-secondary mt-1 font-sans">
              Provide compliance files for verification auditing.
            </p>
          </div>

          <div className="space-y-4">
            <Controller
              name="has_utilization_certificate"
              control={control}
              render={({ field }) => (
                <Toggle
                  label="Utilization Certificate (UC) Available?"
                  helperText="Has a certified audit report or utilization certificate been completed for this project?"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {hasUC && (
              <div className="pt-2 animate-[fadeIn_0.15s_ease-out] space-y-2">
                <label className="block text-xs font-sans font-semibold text-zinc-700 dark:text-zinc-350">
                  Utilization Certificate File *
                </label>
                <div className="border border-border-base rounded-[8px] p-4 flex items-center justify-between bg-bg-page/50 dark:bg-zinc-950/20">
                  <div>
                    {uploadStatus === 'uploaded' ? (
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-150 block truncate max-w-xs">
                        📎 {fileName || 'utilization_certificate.pdf'}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-text-secondary block">
                        Upload utilization audit PDF (Max 5MB)
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="file"
                      id="upload-uc-file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleUCUpload}
                    />
                    {uploading ? (
                      <span className="text-xs font-semibold text-zinc-500 animate-pulse">Uploading...</span>
                    ) : uploadStatus === 'uploaded' ? (
                      <button
                        type="button"
                        onClick={() => document.getElementById('upload-uc-file')?.click()}
                        className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline cursor-pointer"
                      >
                        Change File
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => document.getElementById('upload-uc-file')?.click()}
                        className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Upload UC
                      </button>
                    )}
                  </div>
                </div>
                {errors.utilization_certificate_url && (
                  <span className="text-red-500 text-xs font-sans block">{errors.utilization_certificate_url.message}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-2">
          <Link
            to="/vault"
            className="text-xs font-sans font-semibold text-text-secondary dark:text-text-secondary hover:text-text-primary px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-[6px] transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={createProjectMutation.isPending}
            className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-5 py-3.5 flex items-center space-x-2 disabled:opacity-50 cursor-pointer border-0 shadow-none"
          >
            {createProjectMutation.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving Project...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Project to Vault</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VaultNew;
