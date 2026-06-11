'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <Card variant="glass" padding="lg" className="w-full">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <span className="font-heading font-bold text-2xl gradient-text">EcomAutoPilot</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-text-muted">Sign in to your account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && <div className="p-3 rounded bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>}
        
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          leftIcon={<Mail className="w-4 h-4" />}
        />
        
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-text-muted hover:text-text"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button type="submit" variant="primary" className="w-full mt-6" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-text-muted">
        <span className="bg-bg/50 px-2 relative z-10">or</span>
        <div className="absolute left-0 right-0 border-t border-border top-1/2 -z-0" style={{ transform: 'translateY(-1.2rem)' }} />
      </div>

      <p className="mt-6 text-center text-sm text-text-muted">
        Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
      </p>
    </Card>
  )
}
