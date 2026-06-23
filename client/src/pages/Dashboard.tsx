import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { FileText, ArrowRight } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { profile } = useAuth()
  const [metrics, setMetrics] = useState({
    activeApps: 0,
    upcomingDeadlines: 0,
    matchesCount: 0
  })
  const [inProgressApps, setInProgressApps] = useState<any[]>([])
  const [topMatches, setTopMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // 1. Fetch matches
        const { data: matchedData } = await supabase
          .from('grant_matches')
          .select('*')
          .eq('org_id', profile.id)
          .eq('is_dismissed', false)

        // 2. Fetch applications
        const { data: appsData } = await supabase
          .from('applications')
          .select('*')
          .eq('org_id', profile.id)

        // 3. Fetch grants
        const { data: grantsData } = await supabase
          .from('grants')
          .select('*')
          .eq('is_active', true)

        // Join matches
        const joinedMatches = (matchedData || []).map((m: any) => {
          const grant = (grantsData || []).find((g: any) => g.id === m.grant_id)
          return { ...m, grant }
        }).filter((m: any) => m.grant !== undefined)

        // Join applications
        const joinedApps = (appsData || []).map((a: any) => {
          const grant = (grantsData || []).find((g: any) => g.id === a.grant_id)
          return { ...a, grant }
        }).filter((a: any) => a.grant !== undefined)

        setTopMatches(joinedMatches.sort((a: any, b: any) => b.fit_score - a.fit_score).slice(0, 3))
        
        const active = joinedApps.filter((a: any) => a.status === 'Exploring' || a.status === 'Drafting')
        setInProgressApps(active)

        // Calculate deadlines in next 14 days
        const soon = active.filter((a: any) => {
          const daysLeft = Math.ceil((new Date(a.grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysLeft > 0 && daysLeft <= 14
        })

        setMetrics({
          activeApps: active.length,
          upcomingDeadlines: soon.length,
          matchesCount: joinedMatches.length
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [profile])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-3 border-moss border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-zinc-550 dark:text-zinc-400 font-sans">Assembling dashboard data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
      {/* Header */}
      <div>
        <h1 className="font-satoshi text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm font-sans text-zinc-500 dark:text-zinc-400">
          Welcome back, {profile?.name}.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:divide-x md:divide-zinc-205 dark:md:divide-zinc-800 transition-colors duration-150">
        <div className="flex flex-col items-start pb-4 md:pb-0 md:px-6">
          <span className="font-satoshi text-4.5xl font-bold text-zinc-900 dark:text-zinc-100 tabular">
            {metrics.activeApps}
          </span>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
            Active Applications
          </span>
        </div>

        <div className="flex flex-col items-start py-4 md:py-0 md:px-6">
          <span className="font-satoshi text-4.5xl font-bold text-zinc-900 dark:text-zinc-100 tabular">
            {metrics.upcomingDeadlines}
          </span>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
            Upcoming Deadlines (14d)
          </span>
        </div>

        <div className="flex flex-col items-start pt-4 md:pt-0 md:px-6">
          <span className="font-satoshi text-4.5xl font-bold text-zinc-900 dark:text-zinc-100 tabular">
            {metrics.matchesCount}
          </span>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
            Grants Matched
          </span>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Pipeline snapshot */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            In Progress
          </h2>

          <div className="space-y-3">
            {inProgressApps.length === 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-8 text-center flex flex-col items-center">
                <FileText className="w-8 h-8 text-zinc-350 dark:text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">No active applications.</p>
                <Link to="/grants" className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline mt-2">
                  Browse Matches →
                </Link>
              </div>
            ) : (
              inProgressApps.map(app => {
                const daysLeft = Math.ceil((new Date(app.grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const list = Object.values(app.compliance_checklist || {})
                const completedCount = list.filter(Boolean).length
                const totalCount = list.length

                return (
                  <div 
                    key={app.id} 
                    className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-4 hover:border-zinc-305 dark:hover:border-zinc-700 transition-colors flex items-center justify-between"
                  >
                    <div className="space-y-2 flex-1 pr-4">
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold tracking-wider">
                          {app.grant.funder}
                        </span>
                        <h4 className="font-sans text-sm font-semibold text-zinc-850 dark:text-zinc-200 line-clamp-1">
                          {app.grant.title}
                        </h4>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-moss dark:bg-moss-dark h-full rounded-full transition-all duration-300"
                            style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-sans text-zinc-400 dark:text-zinc-500 font-semibold whitespace-nowrap">
                          {completedCount}/{totalCount} Checklist
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 pl-2">
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          app.status === 'Drafting'
                            ? 'bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover'
                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-405'
                        }`}>
                          {app.status}
                        </span>
                        <span className={`text-[10px] font-semibold tabular ${
                          daysLeft <= 14 
                            ? 'text-amber-text dark:text-amber-500' 
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Closed'}
                        </span>
                      </div>

                      <Link 
                        to={`/applications/${app.id}`}
                        className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center space-x-1"
                      >
                        <span>Continue</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: New matches */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Top Matches for You
          </h2>

          <div className="space-y-3">
            {topMatches.length === 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-8 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">No matches computed yet.</p>
              </div>
            ) : (
              topMatches.map(m => (
                <div 
                  key={m.id} 
                  className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-4 hover:border-zinc-305 dark:hover:border-zinc-700 transition-colors space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="pr-2">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold tracking-wider">
                        {m.grant.funder}
                      </span>
                      <h4 className="font-sans text-sm font-semibold text-zinc-850 dark:text-zinc-200 line-clamp-1">
                        {m.grant.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover shrink-0">
                      {m.fit_score}% Fit
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-[10px] font-sans text-zinc-400 dark:text-zinc-500 tabular">
                      Deadline: {new Date(m.grant.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    
                    {/* Navigate to detail */}
                    {/* Wait, since we are only building Auth, Onboarding & Shared UI, we don't have detail pages, but we can hook them to show details or settings! */}
                    <Link 
                      to={`/grants`}
                      className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center space-x-1"
                    >
                      <span>View Grants</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {topMatches.length > 0 && (
            <div className="flex justify-end pt-1">
              <Link 
                to="/grants" 
                className="text-xs font-semibold text-moss dark:text-moss-dark hover:underline flex items-center space-x-1"
              >
                <span>View all matched grants</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default Dashboard
