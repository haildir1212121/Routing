import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './services/supabase'
import LoginPage from './pages/LoginPage'
import DispatchPage from './pages/DispatchPage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="text-center">
          <div className="text-2xl font-tight mb-2">Dispatch Schedule</div>
          <div className="text-text-tertiary">Loading...</div>
        </div>
      </div>
    )
  }

  return session ? <DispatchPage /> : <LoginPage />
}
