import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { Organization } from '../supabase'

interface AuthContextType {
  user: any
  session: any
  profile: Organization | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ session: any; error: any }>
  signOut: () => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<Organization>) => Promise<{ data: Organization | null; error: any }>
  confirmEmailMock: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Organization | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, set to null (onboarding will create it)
        setProfile(null)
      } else {
        setProfile(data as Organization)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    let subscription: any

    const setupAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setSession(session)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)

      // Listen for changes
      const { data: authData } = supabase.auth.onAuthStateChange(async (_event: string, currentSession: any) => {
        setUser(currentSession?.user ?? null)
        setSession(currentSession)
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      })

      subscription = authData.subscription
    }

    setupAuth()

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    setLoading(false)
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (data?.user && data?.session) {
      setUser(data.user)
      await fetchProfile(data.user.id)
    }
    setLoading(false)
    return { session: data?.session, error }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
    return { error }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const updateProfile = async (data: Partial<Organization>) => {
    if (!user) return { data: null, error: { message: 'No user signed in' } }

    const isNew = !profile
    const payload = {
      ...data,
      user_id: user.id,
      name: data.name || profile?.name || user.user_metadata?.name || 'My Organization'
    }

    try {
      if (isNew) {
        const { data: inserted, error } = await supabase
          .from('organizations')
          .insert(payload)
          .select()
        
        if (!error && inserted && inserted.length > 0) {
          const newProfile = inserted[0] as Organization
          setProfile(newProfile)
          return { data: newProfile, error: null }
        }
        return { data: null, error: error || { message: 'Insert failed to return data' } }
      } else {
        const { data: updated, error } = await supabase
          .from('organizations')
          .update(payload)
          .eq('id', profile.id)
          .select()

        if (!error && updated && updated.length > 0) {
          const newProfile = updated[0] as Organization
          setProfile(newProfile)
          return { data: newProfile, error: null }
        }
        return { data: null, error: error || { message: 'Update failed to return data' } }
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      return { data: null, error: err }
    }
  }

  const confirmEmailMock = () => {
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateProfile,
        confirmEmailMock
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
