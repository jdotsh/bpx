'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthMessages } from '@/components/auth/auth-messages'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'
import Link from 'next/link'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMessage, setShowMessage] = useState<{ type: 'success' | 'info' | 'warning', title: string, description: string } | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const message = searchParams.get('message')
  const registered = searchParams.get('registered')
  const supabase = createClient()
  
  useEffect(() => {
    if (registered === 'true') {
      setShowMessage({
        type: 'info',
        title: 'Email confirmation required',
        description: 'Please check your email and click the confirmation link before signing in.'
      })
    } else if (message === 'email-confirmed') {
      setShowMessage({
        type: 'success',
        title: 'Email confirmed!',
        description: 'Your email has been verified. You can now sign in.'
      })
    } else if (message === 'session-expired') {
      setShowMessage({
        type: 'warning',
        title: 'Session expired',
        description: 'Please sign in again to continue.'
      })
    }
  }, [registered, message])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases with clear messages
        if (data.error?.toLowerCase().includes('invalid login')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (data.error?.toLowerCase().includes('not confirmed')) {
          setError('Please verify your email address before signing in. Check your inbox for the confirmation link.')
        } else if (data.error?.toLowerCase().includes('too many')) {
          setError('Too many login attempts. Please wait a few minutes before trying again.')
        } else {
          setError(data.message || data.error || 'Failed to sign in. Please try again.')
        }
        return
      }

      if (data.user) {
        // Store token in localStorage for demo
        localStorage.setItem('auth-token', data.session.access_token)
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Unable to connect to server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
        }
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Unable to connect to server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">BPMN Studio</CardTitle>
          <CardDescription>
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showMessage && (
            <div className={`rounded-lg border p-4 mb-6 ${
              showMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              showMessage.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-start gap-3">
                {showMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                 showMessage.type === 'warning' ? <AlertCircle className="w-5 h-5 text-yellow-500" /> :
                 <Info className="w-5 h-5 text-blue-500" />}
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{showMessage.title}</h3>
                  <p className="text-sm mt-1 opacity-90">{showMessage.description}</p>
                </div>
              </div>
            </div>
          )}
          
          <AuthMessages />
          
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>

          <div className="mt-4 space-y-2 text-center text-sm">
            <div>
              <Link href="/auth/reset" className="text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
            <div>
              <Link href="/auth/magic-link" className="text-purple-600 hover:text-purple-500 font-medium">
                Sign in with magic link →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  )
}