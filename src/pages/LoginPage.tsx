import { useState } from 'react'
import { supabase } from '../services/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }

    setLoading(false)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary">
      <div className="w-full max-w-md p-8 bg-bg-secondary border border-border rounded-lg">
        <div className="mb-8 text-center">
          <div className="text-3xl font-tight mb-2 text-text-primary">D</div>
          <h1 className="text-2xl font-tight text-text-primary">Dispatch Schedule</h1>
          <p className="text-sm text-text-tertiary mt-2">Route Planner</p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:border-accent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 bg-text-primary text-bg-secondary font-medium rounded hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-text-tertiary text-center mb-3">
            Don't have an account? Sign up below
          </p>
          <button
            onClick={handleSignUp}
            disabled={loading || !email || !password}
            className="w-full py-2 px-3 bg-bg-primary border border-border text-text-primary font-medium rounded hover:bg-border disabled:opacity-50 transition-all"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
