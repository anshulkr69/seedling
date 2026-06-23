import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isMockMode } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { X, Search, AlertCircle } from 'lucide-react'

interface GrantPickerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GrantPickerModal: React.FC<GrantPickerModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !profile) return

    const fetchMatches = async () => {
      setLoading(true)
      try {
        // Fetch matches for this organization
        const { data: matchedData, error: matchError } = await supabase
          .from('grant_matches')
          .select('*')
          .eq('org_id', profile.id)
          .eq('is_dismissed', false)

        if (matchError) throw matchError

        // Fetch all active grants
        const { data: grantsData, error: grantError } = await supabase
          .from('grants')
          .select('*')
          .eq('is_active', true)

        if (grantError) throw grantError

        // Join matches with grants
        const joined = (matchedData || []).map((m: any) => {
          const grant = (grantsData || []).find((g: any) => g.id === m.grant_id)
          return {
            ...m,
            grant
          }
        }).filter((m: any) => m.grant !== undefined)

        setMatches(joined)
      } catch (err) {
        console.error('Error fetching matches for picker:', err)
        // Fallback: If no matches, load all mock grants as a fallback for onboarding sandbox
        if (isMockMode) {
          const { data: grantsData } = await supabase.from('grants').select('*')
          const fallback = (grantsData || []).map((g: any) => ({
            id: `m-fallback-${g.id}`,
            org_id: profile.id,
            grant_id: g.id,
            fit_score: 85,
            grant: g
          }))
          setMatches(fallback)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [isOpen, profile])

  if (!isOpen) return null

  const filteredMatches = matches.filter(m => 
    m.grant.title.toLowerCase().includes(search.toLowerCase()) ||
    m.grant.funder.toLowerCase().includes(search.toLowerCase()) ||
    m.grant.cause_areas.some((c: string) => c.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelectGrant = async (grantId: string) => {
    if (!profile) return

    try {
      // Check if application already exists for this grant
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('org_id', profile.id)
        .eq('grant_id', grantId)
        .single()

      if (existing) {
        navigate(`/applications/${existing.id}`)
        onClose()
        return
      }

      // Create new application
      const defaultChecklist = {
        'Registration certificate': false,
        'Audited financials (last 2 years)': false,
        'Proposal within word limit': false,
        'Budget breakdown included': false,
        'Impact metrics section present': false,
        'Correct file format': false,
        'All mandatory annexures attached': false
      }

      const { data: newApp, error } = await supabase
        .from('applications')
        .insert({
          org_id: profile.id,
          grant_id: grantId,
          status: 'Exploring',
          compliance_checklist: defaultChecklist,
          draft_content: ''
        })
        .select()

      if (error) throw error

      const appRecord = Array.isArray(newApp) ? newApp[0] : newApp
      if (appRecord) {
        navigate(`/applications/${appRecord.id}`)
      } else {
        // Fallback for mock client inserting returning object
        const { data: fetchedApps } = await supabase.from('applications').select('*').eq('org_id', profile.id)
        const matchedApp = (fetchedApps || []).find((a: any) => a.grant_id === grantId)
        if (matchedApp) {
          navigate(`/applications/${matchedApp.id}`)
        } else {
          navigate('/applications')
        }
      }
      onClose()
    } catch (err) {
      console.error('Error starting application:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.15s_ease-out]">
      <div 
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] w-full max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden transition-colors duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Start New Application
            </h3>
            <p className="text-xs font-sans text-zinc-500 dark:text-zinc-400">
              Select one of your matched grants to generate a proposal draft.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[6px] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by funder, cause, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-[6px] text-sm font-sans placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline focus:outline-2 focus:outline-moss dark:focus:outline-moss-dark focus:-outline-offset-1 transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-6 h-6 border-2 border-moss border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">Checking matched grants...</span>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <AlertCircle className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mb-2" />
              <p className="text-sm font-sans font-semibold text-zinc-850 dark:text-zinc-200">No matched grants found</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
                Try updating your organization profile or compliance documentation in Settings to unlock matches.
              </p>
            </div>
          ) : (
            filteredMatches.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectGrant(m.grant_id)}
                className="w-full text-left p-3.5 border border-zinc-200 dark:border-zinc-800/80 rounded-[8px] bg-white dark:bg-zinc-900 hover:border-moss dark:hover:border-moss-dark dark:hover:bg-zinc-800/20 transition-all flex items-start justify-between group cursor-pointer"
              >
                <div className="space-y-1 pr-4">
                  <span className="text-zinc-700 dark:text-zinc-300 font-sans text-[10px] font-bold uppercase tracking-wider">
                    {m.grant.funder}
                  </span>
                  <h4 className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-moss dark:group-hover:text-moss-dark transition-colors">
                    {m.grant.title}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.grant.cause_areas.map((cause: string) => (
                      <span key={cause} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 px-2 py-0.5 rounded-[4px] font-sans">
                        {cause}
                      </span>
                    ))}
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-[4px] font-sans tabular">
                      ₹{(m.grant.budget_max/100000).toFixed(0)}L Max
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1.5 shrink-0 pl-2">
                  <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover">
                    {m.fit_score}% Fit
                  </span>
                  <span className="text-[10px] font-sans text-zinc-400 dark:text-zinc-500 tabular">
                    {Math.ceil((new Date(m.grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="text-xs font-sans font-semibold text-zinc-500 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[6px] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
