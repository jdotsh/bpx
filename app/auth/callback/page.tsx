'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/auth/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the error from URL if any
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          setErrorMessage(errorDescription || 'Authentication failed. Please try again.')
          setStatus('error')
          return
        }

        // Check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setErrorMessage('Failed to establish session. Please try signing in again.')
          setStatus('error')
          return
        }

        if (session) {
          setStatus('success')
          // Get redirect target or default to dashboard
          const redirectTo = searchParams.get('redirectTo') || '/dashboard'
          
          // Small delay for visual feedback
          setTimeout(() => {
            router.push(redirectTo)
            router.refresh()
          }, 1500)
        } else {
          // No session means the callback didn't work
          setErrorMessage('Authentication callback failed. Please try signing in again.')
          setStatus('error')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setErrorMessage('An unexpected error occurred. Please try again.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [router, searchParams, supabase])

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">Completing sign in...</CardTitle>
            <CardDescription>
              Please wait while we verify your authentication
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Successfully signed in!</CardTitle>
            <CardDescription>
              Redirecting you to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Failed</CardTitle>
          <CardDescription>
            We couldn't complete your sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {errorMessage || 'An error occurred during authentication. Please try again.'}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Link href="/auth/signin" className="block">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                Try signing in again
              </button>
            </Link>
            
            <Link href="/auth/signup" className="block">
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition">
                Create a new account
              </button>
            </Link>
            
            <div className="text-center text-sm text-gray-600 mt-4">
              <p>Common issues:</p>
              <ul className="mt-2 text-left space-y-1">
                <li>• Email not verified yet</li>
                <li>• Link expired (links expire after 1 hour)</li>
                <li>• Already used this link</li>
                <li>• Database not configured (for developers)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}