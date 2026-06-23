import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { Button } from '../components/Button'
import { Input, Textarea, Select, Toggle, Stepper } from '../components/Input'
import { UploadCloud, CheckCircle, Info, Moon, Sun } from 'lucide-react'

// Tab definitions
type TabType = 'profile' | 'compliance' | 'account'

export const Settings: React.FC = () => {
  const { profile, updateProfile, signOut, user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme from HTML class list
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDarkMode
    setIsDarkMode(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('seedling-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('seedling-theme', 'light')
    }
  }

  // 1. Tab 1: Organization Profile Form
  const { register: regProfile, handleSubmit: handleProfileSubmit } = useForm({
    defaultValues: {
      name: profile?.name || '',
      type: profile?.type || 'NGO',
      legal_entity_type: profile?.legal_entity_type || 'Trust',
      location: profile?.location || '',
      mission_statement: profile?.mission_statement || '',
      geography_of_impact: profile?.geography_of_impact || 'Local',
      target_beneficiaries: profile?.target_beneficiaries || ''
    }
  })

  // 2. Tab 2: Compliance Docs Form
  const [teamSize, setTeamSize] = useState(profile?.team_size || 5)
  const [audited, setAudited] = useState(profile?.has_audited_financials || false)
  const [has12A80G, setHas12A80G] = useState(profile?.has_12A_80G || false)
  const [hasFCRA, setHasFCRA] = useState(profile?.has_fcra || false)

  const { register: regCompliance, handleSubmit: handleComplianceSubmit } = useForm({
    defaultValues: {
      annual_turnover_range: profile?.annual_turnover_range || '<10L',
      ngo_darpan_id: profile?.ngo_darpan_id || '',
      csr_1_registration: profile?.csr_1_registration || ''
    }
  })

  // Simulated upload statuses
  const [uploads, setUploads] = useState({
    cert12A: profile?.has_12A_80G ? 'Uploaded' : 'Not uploaded',
    certFCRA: profile?.has_fcra ? 'Uploaded' : 'Not uploaded',
    auditReport: profile?.has_audited_financials ? 'Uploaded' : 'Not uploaded',
    certCSR1: profile?.csr_1_registration ? 'Uploaded' : 'Not uploaded'
  })

  const simulateUpload = (type: keyof typeof uploads) => {
    setUploads(prev => ({ ...prev, [type]: 'Uploading...' }))
    setTimeout(() => {
      setUploads(prev => ({ ...prev, [type]: 'Uploaded' }))
      if (type === 'cert12A') setHas12A80G(true)
      if (type === 'certFCRA') setHasFCRA(true)
      if (type === 'auditReport') setAudited(true)
    }, 1200)
  }

  // Submit profile updates
  const onProfileSave = async (data: any) => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await updateProfile({
        name: data.name,
        type: data.type,
        legal_entity_type: data.legal_entity_type,
        location: data.location,
        mission_statement: data.mission_statement,
        geography_of_impact: data.geography_of_impact,
        target_beneficiaries: data.target_beneficiaries
      })
      if (error) throw error
      setMessage('Profile updated successfully.')
    } catch (e: any) {
      setMessage(e.message || 'Error updating profile.')
    } finally {
      setLoading(false)
    }
  }

  // Submit compliance updates
  const onComplianceSave = async (data: any) => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await updateProfile({
        team_size: teamSize,
        has_audited_financials: audited,
        annual_turnover_range: data.annual_turnover_range,
        has_12A_80G: has12A80G,
        has_fcra: hasFCRA,
        ngo_darpan_id: data.ngo_darpan_id || undefined,
        csr_1_registration: data.csr_1_registration || undefined
      })
      if (error) throw error
      setMessage('Compliance profile saved. Your grant matches are updated.')
    } catch (e: any) {
      setMessage(e.message || 'Error saving compliance.')
    } finally {
      setLoading(false)
    }
  }

  // Simulated account actions
  const handleDeleteAccount = async () => {
    const typedName = prompt(`WARNING: This action is permanent.\nType your organization name "${profile?.name}" exactly to confirm account deletion:`)
    if (typedName === profile?.name) {
      setLoading(true)
      try {
        await supabase.from('organizations').delete().eq('id', profile.id)
        await signOut()
        navigate('/')
      } catch (err) {
        alert('Error deleting account')
        setLoading(false)
      }
    } else if (typedName !== null) {
      alert('Verification mismatch. Action aborted.')
    }
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-satoshi text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Settings
          </h1>
          <p className="text-sm font-sans text-zinc-500 dark:text-zinc-400">
            Manage your NGO profile, statutory registrations, and theme toggles.
          </p>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-2 border border-zinc-200 dark:border-zinc-800 rounded-[6px] px-3.5 py-2 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-350 hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          {isDarkMode ? (
            <>
              <Sun size={14} />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={14} />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Save Success/Error Banner */}
      {message && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200 dark:border-zinc-800 rounded-[6px] text-zinc-800 dark:text-zinc-200 text-xs font-sans flex items-center space-x-2 animate-[scaleIn_0.15s_ease-out]">
          <Info size={16} className="text-moss dark:text-moss-dark" />
          <span>{message}</span>
        </div>
      )}

      {/* Horizontal Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-6">
        <button
          onClick={() => { setActiveTab('profile'); setMessage(null); }}
          className={`pb-3 text-sm font-sans font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-moss text-moss dark:border-moss-dark dark:text-moss-dark-hover'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          Organization Profile
        </button>
        <button
          onClick={() => { setActiveTab('compliance'); setMessage(null); }}
          className={`pb-3 text-sm font-sans font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'compliance'
              ? 'border-moss text-moss dark:border-moss-dark dark:text-moss-dark-hover'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          Compliance Docs
        </button>
        <button
          onClick={() => { setActiveTab('account'); setMessage(null); }}
          className={`pb-3 text-sm font-sans font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'account'
              ? 'border-moss text-moss dark:border-moss-dark dark:text-moss-dark-hover'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          Account
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-150">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
            <Input
              label="Organization Name"
              type="text"
              required
              {...regProfile('name')}
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
                {...regProfile('type')}
              />

              <Select
                label="Legal Entity Type"
                options={[
                  { value: 'Trust', label: 'Registered Trust' },
                  { value: 'Society', label: 'Registered Society' },
                  { value: 'Section 8 Company', label: 'Section 8 Company' },
                  { value: 'Unregistered', label: 'Unregistered Entity' }
                ]}
                {...regProfile('legal_entity_type')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Location (City, State)"
                type="text"
                required
                {...regProfile('location')}
              />
              <Select
                label="Operational Scope"
                options={[
                  { value: 'Local', label: 'Local' },
                  { value: 'State', label: 'State' },
                  { value: 'National', label: 'National' },
                  { value: 'International', label: 'International' }
                ]}
                {...regProfile('geography_of_impact')}
              />
            </div>

            <Input
              label="Primary Beneficiaries"
              type="text"
              required
              {...regProfile('target_beneficiaries')}
            />

            <Textarea
              label="Mission Statement"
              rows={4}
              maxLength={300}
              {...regProfile('mission_statement')}
            />

            <Button type="submit" disabled={loading} className="w-full md:w-auto py-2.5 px-6">
              {loading ? 'Saving Profile...' : 'Save Changes'}
            </Button>
          </form>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <form onSubmit={handleComplianceSubmit(onComplianceSave)} className="space-y-6">
            <div className="space-y-4">
              <Stepper
                label="Active Team Size"
                value={teamSize}
                onChange={setTeamSize}
                min={1}
                max={1000}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Annual Turnover Range (INR)"
                  options={[
                    { value: '<10L', label: 'Less than ₹10 Lakhs' },
                    { value: '10L-50L', label: '₹10 Lakhs – ₹50 Lakhs' },
                    { value: '50L-1Cr', label: '₹50 Lakhs – ₹1 Crore' },
                    { value: '>1Cr', label: 'Greater than ₹1 Crore' }
                  ]}
                  {...regCompliance('annual_turnover_range')}
                />
                
                <div className="pt-2">
                  <Toggle
                    label="Audited Financial Statements"
                    helperText="Enables audited compliance verification checks"
                    checked={audited}
                    onChange={setAudited}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Toggle
                  label="12A / 80G Tax Exempt Certificate"
                  helperText="Required by institutional foundations"
                  checked={has12A80G}
                  onChange={setHas12A80G}
                />
                <Toggle
                  label="FCRA Certificate"
                  helperText="Enables foreign donation grants"
                  checked={hasFCRA}
                  onChange={setHasFCRA}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Input
                  label="NGO Darpan ID (Optional)"
                  placeholder="e.g. KA/2018/019XXXX"
                  {...regCompliance('ngo_darpan_id')}
                />

                <Input
                  label="CSR-1 Registration (Optional)"
                  placeholder="e.g. CSR0001XXXX"
                  {...regCompliance('csr_1_registration')}
                />
              </div>
            </div>

            {/* Document Upload slots */}
            <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Compliance Document Storage
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 12A/80G Upload slot */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">12A / 80G Certificate</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">PDF, Max 5MB</span>
                  </div>
                  
                  {uploads.cert12A === 'Uploaded' ? (
                    <span className="text-xs font-bold text-moss dark:text-moss-dark-hover flex items-center gap-1"><CheckCircle size={14} /> Uploaded</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => simulateUpload('cert12A')}
                      disabled={uploads.cert12A === 'Uploading...'}
                      className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud size={14} /> {uploads.cert12A === 'Uploading...' ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </div>

                {/* FCRA Upload slot */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">FCRA Certificate</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">PDF, Max 5MB</span>
                  </div>
                  
                  {uploads.certFCRA === 'Uploaded' ? (
                    <span className="text-xs font-bold text-moss dark:text-moss-dark-hover flex items-center gap-1"><CheckCircle size={14} /> Uploaded</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => simulateUpload('certFCRA')}
                      disabled={uploads.certFCRA === 'Uploading...'}
                      className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud size={14} /> {uploads.certFCRA === 'Uploading...' ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </div>

                {/* Audit Certificate */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">Audited Balance Sheets</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">PDF, Max 10MB</span>
                  </div>
                  
                  {uploads.auditReport === 'Uploaded' ? (
                    <span className="text-xs font-bold text-moss dark:text-moss-dark-hover flex items-center gap-1"><CheckCircle size={14} /> Uploaded</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => simulateUpload('auditReport')}
                      disabled={uploads.auditReport === 'Uploading...'}
                      className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud size={14} /> {uploads.auditReport === 'Uploading...' ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </div>

                {/* CSR-1 Certificate */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">CSR-1 registration</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">PDF, Max 5MB</span>
                  </div>
                  
                  {uploads.certCSR1 === 'Uploaded' ? (
                    <span className="text-xs font-bold text-moss dark:text-moss-dark-hover flex items-center gap-1"><CheckCircle size={14} /> Uploaded</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => simulateUpload('certCSR1')}
                      disabled={uploads.certCSR1 === 'Uploading...'}
                      className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud size={14} /> {uploads.certCSR1 === 'Uploading...' ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto py-2.5 px-6">
              {loading ? 'Saving Compliance...' : 'Save Compliance'}
            </Button>
          </form>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 block mb-1">
                  Registered Email Address
                </span>
                <span className="text-sm font-sans font-semibold text-zinc-850 dark:text-zinc-200">
                  {user?.email || 'test@example.com'}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 block mb-1">
                  Security
                </span>
                <button
                  type="button"
                  onClick={() => alert('Password reset simulation sent to ' + user?.email)}
                  className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Send password reset email
                </button>
              </div>
            </div>

            <div className="border-t border-red-100 dark:border-red-950/20 pt-6 space-y-3">
              <h3 className="font-satoshi text-base font-bold text-red-650 dark:text-red-400 tracking-tight">
                Delete Account
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                Deletes the NGO profile cascade. All logged projects, matches, and application drafts will be permanently removed. This cannot be undone.
              </p>
              <Button 
                onClick={handleDeleteAccount} 
                disabled={loading}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white border-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
              >
                Delete Organization Account
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
export default Settings
