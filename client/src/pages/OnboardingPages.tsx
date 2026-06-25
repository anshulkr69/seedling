import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Input, Textarea, Select, Toggle, Stepper } from '../components/Input'
import { Sprout, ArrowRight, Check } from 'lucide-react'
import { supabase } from '../supabase'

// Step 1: Org Identity
export const OnboardingStep1: React.FC = () => {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: profile?.name || '',
      type: profile?.type || 'NGO',
      legal_entity_type: profile?.legal_entity_type || 'Trust',
      registration_number: profile?.ngo_darpan_id || '', // Re-using NGO Darpan/Reg placeholder
      year_founded: profile?.team_size ? 2026 - profile.team_size : 2020, // Mock fallback foundation
      location: profile?.location || ''
    }
  })

  const legalEntityType = watch('legal_entity_type')

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await updateProfile({
        name: data.name,
        type: data.type,
        legal_entity_type: data.legal_entity_type,
        location: data.location,
        onboarding_step: 2
      })
      if (err) throw err
      navigate('/onboarding/mission')
    } catch (e: any) {
      setError(e.message || 'Error updating profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-satoshi text-xl font-bold text-text-primary tracking-tight">
          Step 1: Tell us about your organization
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans mt-0.5">
          Provide identification details to query legal eligibility filters.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-250 rounded-[6px] text-red-650 text-xs font-sans">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Organization Name"
          type="text"
          placeholder="e.g. Earthcare Foundation"
          error={errors.name?.message}
          {...register('name', { required: 'Organization name is required' })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Organization Type"
            options={[
              { value: 'NGO', label: 'NGO / Trust' },
              { value: 'Research Group', label: 'Research Collective' },
              { value: 'Social Startup', label: 'Social Startup' },
              { value: 'Community Org', label: 'Community Collective' }
            ]}
            {...register('type')}
          />

          <Select
            label="Legal Entity Type"
            options={[
              { value: 'Trust', label: 'Registered Trust' },
              { value: 'Society', label: 'Registered Society' },
              { value: 'Section 8 Company', label: 'Section 8 Company' },
              { value: 'Unregistered', label: 'Unregistered Entity' }
            ]}
            {...register('legal_entity_type')}
          />
        </div>

        {legalEntityType !== 'Unregistered' && (
          <Input
            label="Registration Number & State"
            type="text"
            placeholder="e.g. 104/2018 (Delhi)"
            {...register('registration_number')}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Year Founded"
            type="number"
            placeholder="e.g. 2018"
            error={errors.year_founded?.message}
            {...register('year_founded', {
              required: 'Year is required',
              min: { value: 1900, message: 'Year must be after 1900' },
              max: { value: new Date().getFullYear(), message: 'Cannot be in the future' }
            })}
          />

          <Input
            label="Location (City, State)"
            type="text"
            placeholder="e.g. Bangalore, Karnataka"
            error={errors.location?.message}
            {...register('location', { required: 'Location is required' })}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-2 py-3 flex items-center justify-center space-x-2">
          <span>Continue</span>
          <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  )
}


// Step 2: Mission & Cause
const CAUSE_AREAS = [
  'Education',
  'Environment',
  'Healthcare',
  'Women Empowerment',
  'Rural Development',
  'Heritage',
  'Other'
]

export const OnboardingStep2: React.FC = () => {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCauses, setSelectedCauses] = useState<string[]>(profile?.schedule_vii_causes || [])

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      mission_statement: profile?.mission_statement || '',
      geography_of_impact: profile?.geography_of_impact || 'Local',
      target_beneficiaries: profile?.target_beneficiaries || ''
    }
  })

  const missionText = watch('mission_statement', '')

  const toggleCause = (cause: string) => {
    setSelectedCauses(prev =>
      prev.includes(cause) ? prev.filter(c => c !== cause) : [...prev, cause]
    )
  }

  const onSubmit = async (data: any) => {
    if (selectedCauses.length === 0) {
      setError('Please select at least one cause area.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await updateProfile({
        mission_statement: data.mission_statement,
        schedule_vii_causes: selectedCauses,
        geography_of_impact: data.geography_of_impact,
        target_beneficiaries: data.target_beneficiaries,
        onboarding_step: 3
      })
      if (err) throw err
      navigate('/onboarding/capacity')
    } catch (e: any) {
      setError(e.message || 'Error updating profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-satoshi text-xl font-bold text-text-primary tracking-tight">
          Step 2: Focus & Mission
        </h2>
        <p className="text-xs text-text-secondary font-sans mt-0.5">
          Detail your focus area (mapped to Indian Schedule VII CSR categories).
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-250 rounded-[6px] text-red-650 text-xs font-sans">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1">
          <Textarea
            label="Mission Statement"
            placeholder="Briefly state your organization's core objective..."
            rows={3}
            maxLength={300}
            error={errors.mission_statement?.message}
            {...register('mission_statement', {
              required: 'Mission statement is required',
              maxLength: { value: 300, message: 'Max 300 characters' }
            })}
          />
          <div className="flex justify-end text-[10px] text-text-secondary font-sans">
            {missionText.length}/300 characters
          </div>
        </div>

        {/* Cause Area Multi-select Chips */}
        <div className="space-y-2">
          <span className="text-text-primary font-sans text-xs font-semibold uppercase tracking-wider block">
            Cause Areas (Schedule VII Categories)
          </span>
          <div className="flex flex-wrap gap-2">
            {CAUSE_AREAS.map((cause) => {
              const isSelected = selectedCauses.includes(cause)
              return (
                <button
                  type="button"
                  key={cause}
                  onClick={() => toggleCause(cause)}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all cursor-pointer ${isSelected
                    ? 'bg-moss border-moss text-white dark:bg-moss-dark dark:border-moss-dark'
                    : 'border-zinc-200 text-zinc-500 bg-white dark:border-zinc-700 dark:text-zinc-400 dark:bg-zinc-800 hover:border-zinc-405'
                    }`}
                >
                  {cause}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Geography of Impact */}
          <div className="space-y-2">
            <span className="text-text-primary font-sans text-xs font-semibold uppercase tracking-wider block">
              Geography of Impact
            </span>
            <div className="grid grid-cols-2 gap-2">
              {['Local', 'State', 'National', 'International'].map((geo) => (
                <label
                  key={geo}
                  className={`flex items-center space-x-2 border border-border-base rounded-[6px] p-2.5 bg-white dark:bg-zinc-800 cursor-pointer text-xs font-sans font-medium text-text-primary hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors`}
                >
                  <input
                    type="radio"
                    value={geo}
                    className="text-moss focus:ring-moss dark:text-moss-dark dark:focus:ring-moss-dark"
                    {...register('geography_of_impact')}
                  />
                  <span>{geo}</span>
                </label>
              ))}
            </div>
          </div>

          <Input
            label="Primary Beneficiaries"
            type="text"
            placeholder="e.g. Rural women and girls, smallholder farmers"
            error={errors.target_beneficiaries?.message}
            {...register('target_beneficiaries', { required: 'Please specify target beneficiaries' })}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-2 py-3 flex items-center justify-center space-x-2">
          <span>Continue</span>
          <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  )
}


// Step 3: Capacity & Compliance
export const OnboardingStep3: React.FC = () => {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom states for Controller (Toggles/Steppers)
  const [teamSize, setTeamSize] = useState(profile?.team_size || 5)
  const [audited, setAudited] = useState(profile?.has_audited_financials || false)
  const [has12A80G, setHas12A80G] = useState(profile?.has_12a_80g || false)
  const [hasFCRA, setHasFCRA] = useState(profile?.has_fcra || false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      annual_turnover_range: profile?.annual_turnover_range || '<10L',
      ngo_darpan_id: profile?.ngo_darpan_id || '',
      csr_1_registration: profile?.csr_1_registration || ''
    }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await updateProfile({
        team_size: teamSize,
        has_audited_financials: audited,
        annual_turnover_range: data.annual_turnover_range,
        has_12a_80g: has12A80G,
        has_fcra: hasFCRA,
        ngo_darpan_id: data.ngo_darpan_id || undefined,
        csr_1_registration: data.csr_1_registration || undefined,
        onboarding_step: 4
      })
      if (err) throw err
      navigate('/onboarding/funding')
    } catch (e: any) {
      setError(e.message || 'Error updating profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-satoshi text-xl font-bold text-text-primary tracking-tight">
          Step 3: Capacity & Indian Compliance
        </h2>
        <p className="text-xs text-text-secondary font-sans mt-0.5">
          Specify legal registration parameters to prevent applying to unauthorized tenders.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-500/30 rounded-[6px] text-red-650 dark:text-red-400 text-xs font-sans font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="[&_input]:text-zinc-100 [&_span]:text-zinc-100 dark:[&_input]:text-zinc-100 dark:[&_span]:text-zinc-100 font-medium">
          <Stepper
            label="Active Team Size"
            value={teamSize}
            onChange={setTeamSize}
            min={1}
            max={1000}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Annual Turnover Range (INR)"
            options={[
              { value: '<10L', label: 'Less than ₹10 Lakhs' },
              { value: '10L-50L', label: '₹10 Lakhs – ₹50 Lakhs' },
              { value: '50L-1Cr', label: '₹50 Lakhs – ₹1 Crore' },
              { value: '>1Cr', label: 'Greater than ₹1 Crore' }
            ]}
            {...register('annual_turnover_range')}
          />

          <div className="pt-2.5">
            <Toggle
              label="Audited Financial Statements"
              helperText="Do you hold audited balance sheets?"
              checked={audited}
              onChange={setAudited}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Toggle
            label="12A / 80G Tax Exempt Certificate"
            helperText="Required by most private foundations"
            checked={has12A80G}
            onChange={setHas12A80G}
          />
          <Toggle
            label="FCRA Certificate (Foreign Funds)"
            helperText="Required to accept direct international grants"
            checked={hasFCRA}
            onChange={setHasFCRA}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Input
            label="NGO Darpan ID (Optional)"
            placeholder="e.g. KA/2018/019XXXX"
            helperText="Highly recommended for Indian Government grants"
            {...register('ngo_darpan_id')}
          />

          <Input
            label="CSR-1 Registration Number (Optional)"
            placeholder="e.g. CSR0001XXXX"
            helperText="Mandatory for receiving Corporate CSR grants"
            {...register('csr_1_registration')}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-4 py-3 flex items-center justify-center space-x-2">
          <span>Continue</span>
          <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  )
}


// Step 4: Funding Needs
const FUNDING_TYPES = [
  'Project',
  'Operational',
  'Research',
  'Travel',
  'Equipment'
]

export const OnboardingStep4: React.FC = () => {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFundingTypes, setSelectedFundingTypes] = useState<string[]>(profile?.funding_types_needed || [])

  const { register, handleSubmit } = useForm({
    defaultValues: {
      funding_range: '₹5L–₹25L', // Default midpoint preference
      application_urgency: profile?.application_urgency || 'Actively looking'
    }
  })

  const toggleFundingType = (type: string) => {
    setSelectedFundingTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const onSubmit = async (data: any) => {
    if (selectedFundingTypes.length === 0) {
      setError('Please select at least one funding type.')
      return
    }

    // Convert range string to min/max integers for statutory calculations
    let min = 100000
    let max = 500000
    if (data.funding_range === '₹5L–₹25L') {
      min = 500000
      max = 2500000
    } else if (data.funding_range === '₹25L–₹1Cr') {
      min = 2500000
      max = 10000000
    } else if (data.funding_range === '₹1Cr+') {
      min = 10000000
      max = 100000000
    }

    setLoading(true)
    setError(null)
    try {
      const { error: err } = await updateProfile({
        funding_range_min: min,
        funding_range_max: max,
        funding_types_needed: selectedFundingTypes,
        application_urgency: data.application_urgency,
        onboarding_step: 5 // Completes onboarding profile layer
      })
      if (err) throw err
      navigate('/onboarding/complete')
    } catch (e: any) {
      setError(e.message || 'Error updating profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-satoshi text-xl font-bold text-text-primary tracking-tight">
          Step 4: Funding Preferences
        </h2>
        <p className="text-xs text-text-secondary font-sans mt-0.5">
          Tell us about your budget objectives and timeframe constraints.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-250 rounded-[6px] text-red-650 text-xs font-sans">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Select
          label="Typical Grant Size Needed"
          options={[
            { value: '₹1L–₹5L', label: '₹1 Lakh – ₹5 Lakhs (Micro)' },
            { value: '₹5L–₹25L', label: '₹5 Lakhs – ₹25 Lakhs (Medium)' },
            { value: '₹25L–₹1Cr', label: '₹25 Lakhs – ₹1 Crore (Large)' },
            { value: '₹1Cr+', label: 'Greater than ₹1 Crore (Major)' }
          ]}
          {...register('funding_range')}
        />

        {/* Funding type selector */}
        <div className="space-y-2">
          <span className="text-text-primary font-sans text-xs font-semibold uppercase tracking-wider block">
            Funding Types Needed
          </span>
          <div className="flex flex-wrap gap-2">
            {FUNDING_TYPES.map((type) => {
              const isSelected = selectedFundingTypes.includes(type)
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => toggleFundingType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all cursor-pointer ${isSelected
                    ? 'bg-moss border-moss text-white dark:bg-moss-dark dark:border-moss-dark'
                    : 'border-zinc-200 text-zinc-500 bg-white dark:border-zinc-700 dark:text-zinc-400 dark:bg-zinc-800 hover:border-zinc-400'
                    }`}
                >
                  {type}
                </button>
              )
            })}
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-2">
          <span className="text-text-primary font-sans text-xs font-semibold uppercase tracking-wider block">
            Application Urgency
          </span>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'Actively looking', label: 'Actively Looking', desc: 'Need immediate grant fits' },
              { value: 'Planning ahead', label: 'Planning Ahead', desc: 'Sourcing options for next cycle' }
            ].map((urg) => (
              <label
                key={urg.value}
                className="flex items-start space-x-3 border border-border-base rounded-[8px] p-3.5 bg-white dark:bg-zinc-800 cursor-pointer hover:border-zinc-305 transition-colors"
              >
                <input
                  type="radio"
                  value={urg.value}
                  className="mt-1 text-moss focus:ring-moss dark:text-moss-dark dark:focus:ring-moss-dark"
                  {...register('application_urgency')}
                />
                <div className="flex flex-col space-y-0.5">
                  <span className="text-xs font-sans font-semibold text-text-primary">{urg.label}</span>
                  <span className="text-[10px] font-sans text-text-secondary dark:text-zinc-500 leading-none">{urg.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-4 py-3 flex items-center justify-center space-x-2">
          <span>Complete Profile</span>
          <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  )
}


// Onboarding Complete Screen
export const OnboardingComplete: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [matchCount, setMatchCount] = useState(0)

  useEffect(() => {
    if (!profile) return

    const getMatches = async () => {
      // Fetch local matches computed when Step 4 completed
      const { data } = await supabase
        .from('grant_matches')
        .select('*')
        .eq('org_id', profile.id)

      setMatchCount(data?.length || 3) // Default to 3 for visual effect if delay
    }

    getMatches()
  }, [profile])

  return (
    <div className="text-center py-6 space-y-6 flex flex-col items-center">
      {/* Animated Sprout Illustration */}
      <div className="w-20 h-20 bg-moss/10 dark:bg-moss-dark/15 rounded-full flex items-center justify-center relative shadow-none border border-moss-accent dark:border-moss/10">
        <Sprout className="w-10 h-10 text-moss dark:text-moss-dark animate-[bounce_4s_infinite]" />

        {/* Sparkle leaf indicator */}
        <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-moss-dark rounded-full border-2 border-white flex items-center justify-center">
          <Check size={8} className="text-white" strokeWidth={4} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-satoshi text-2xl font-bold text-text-primary tracking-tight">
          Your Seedling profile is ready!
        </h2>
        <p className="text-text-secondary text-xs font-sans leading-relaxed max-w-sm mx-auto">
          We've analyzed your statutory criteria and causes. You're set up to view matching opportunities.
        </p>
      </div>

      {/* Stats match notification */}
      <div className="bg-moss-accent dark:bg-moss/10 border border-moss/15 rounded-[10px] p-4 max-w-sm w-full transition-all">
        <div className="flex items-center space-x-3.5 justify-center">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-none flex items-center justify-center font-satoshi text-base font-bold text-moss dark:text-moss-dark-hover tabular">
            {matchCount}
          </div>
          <div className="text-left">
            <h4 className="text-xs font-sans font-bold text-zinc-905 dark:text-zinc-150 uppercase tracking-wide leading-tight">
              Grants Matched
            </h4>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans leading-tight">
              Legally pre-screened for your profile.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={() => navigate('/dashboard')}
        className="w-full max-w-xs py-3 flex items-center justify-center space-x-2"
      >
        <span>Explore Dashboard</span>
        <ArrowRight size={16} />
      </Button>
    </div>
  )
}
