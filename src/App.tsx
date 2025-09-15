import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AdminDashboard } from './components/AdminDashboard'
import { ClientGallery } from './components/ClientGallery'
import { AuthPage } from './components/AuthPage'
import { projectId, publicAnonKey } from './utils/supabase/info'

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export default function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          setUserRole(session.user.user_metadata?.role || 'client')
        }
      } catch (error) {
        console.error('Session error:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          setUserRole(session.user.user_metadata?.role || 'client')
        } else {
          setUser(null)
          setUserRole(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage supabase={supabase} />
  }

  if (userRole === 'admin') {
    return <AdminDashboard user={user} supabase={supabase} onSignOut={handleSignOut} />
  }

  return <ClientGallery user={user} supabase={supabase} onSignOut={handleSignOut} />
}