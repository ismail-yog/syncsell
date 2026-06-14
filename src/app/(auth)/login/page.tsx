'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const errParam = searchParams.get('error')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <>
      {errParam === 'not_authenticated' && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-6 text-center">
          Please log in to continue.
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-6 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-slate-400"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-slate-400"
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:scale-[1.02] active:scale-[0.98] transition-all glow-primary flex items-center justify-center space-x-2"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <span>Sign In</span>}
        </button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="glass-card rounded-2xl p-8 w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          SyncSell
        </h1>
        <p className="text-muted-foreground mt-2">Welcome back to the future of eBay.</p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>}>
        <LoginForm />
      </Suspense>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </div>
    </div>
  )
}
