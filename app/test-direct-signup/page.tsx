'use client'

import { useState } from 'react'
import { createClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDirectSignup() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testSignup = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const testEmail = `test${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      if (error) {
        setResult({ 
          success: false, 
          error: error.message,
          details: error
        })
      } else {
        setResult({ 
          success: true, 
          user: data.user,
          message: 'Signup successful! Check email for verification.'
        })
      }
    } catch (err) {
      setResult({ 
        success: false, 
        error: 'Unexpected error',
        details: err
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Direct Supabase Signup Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              This tests signup directly with Supabase client, bypassing our API routes.
            </p>
            
            <Button 
              onClick={testSignup} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Direct Signup'}
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '✅ Success!' : '❌ Failed'}
              </h3>
              
              {result.success ? (
                <div className="text-sm text-green-700">
                  <p>User ID: {result.user?.id}</p>
                  <p>Email: {result.user?.email}</p>
                  <p className="mt-2 font-semibold">{result.message}</p>
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <p className="font-semibold">{result.error}</p>
                  {result.details && (
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">Test Information:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Uses random email to avoid duplicates</li>
              <li>• Tests Supabase auth directly</li>
              <li>• Bypasses our API routes</li>
              <li>• If this works, issue is in our API</li>
              <li>• If this fails, issue is with Supabase config</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}