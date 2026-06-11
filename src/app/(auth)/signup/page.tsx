'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  return (
    <Card variant="glass" padding="lg" className="w-full">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <span className="font-heading font-bold text-2xl gradient-text">EcomAutoPilot</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-text-muted">Start optimizing your listings</p>
      </div>

      {success ? (
        <div className="text-center p-6 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-success font-medium">Check your email for the confirmation link.</p>
        </div>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          {error && <div className="p-3 rounded bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>}
          
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            leftIcon={<User className="w-4 h-4" />}
          />

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
            Create Account
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </Card>
  )
}
