import { createServerClient } from '@/lib/auth/server'

export default async function TestSupabase() {
  // Test Supabase connection
  const supabase = createServerClient()
  
  // Try to get auth session
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  // Try to query a table (will fail if not created yet, that's ok)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5)
  
  // Get Supabase status
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
      
      <div className="space-y-6">
        {/* Configuration Status */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={supabaseUrl ? "text-green-500" : "text-red-500"}>
                {supabaseUrl ? "✅" : "❌"}
              </span>
              <span>Supabase URL: {supabaseUrl || "Not configured"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasAnnonKey ? "text-green-500" : "text-red-500"}>
                {hasAnnonKey ? "✅" : "❌"}
              </span>
              <span>Anon Key: {hasAnnonKey ? "Configured" : "Missing"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasServiceKey ? "text-green-500" : "text-red-500"}>
                {hasServiceKey ? "✅" : "❌"}
              </span>
              <span>Service Role Key: {hasServiceKey ? "Configured" : "Missing - Get from Supabase Dashboard"}</span>
            </div>
          </div>
        </div>

        {/* Auth Status */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
          {authError ? (
            <div className="text-red-500">
              <p>❌ Auth Error: {authError.message}</p>
            </div>
          ) : (
            <div>
              <p className="text-green-500">✅ Auth service connected</p>
              {session ? (
                <p>Logged in as: {session.user.email}</p>
              ) : (
                <p>No active session (not logged in)</p>
              )}
            </div>
          )}
        </div>

        {/* Database Status */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Database Status</h2>
          {profileError ? (
            <div>
              <p className="text-yellow-500">⚠️ Database query failed</p>
              <p className="text-sm text-gray-600">Error: {profileError.message}</p>
              <p className="text-sm text-gray-600 mt-2">
                This is normal if you haven't run the database setup SQL yet.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-green-500">✅ Database connected</p>
              <p>Profiles table has {profiles?.length || 0} records</p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          {!hasServiceKey && (
            <div className="mb-4">
              <p className="font-semibold">1. Get Service Role Key:</p>
              <p className="text-sm text-gray-600">
                Go to your Supabase Dashboard → Settings → API → Service Role Key
              </p>
              <a 
                href={`https://supabase.com/dashboard/project/${supabaseUrl?.split('.')[0].replace('https://', '')}/settings/api`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline text-sm"
              >
                Open Supabase Dashboard →
              </a>
            </div>
          )}
          
          {profileError && (
            <div className="mb-4">
              <p className="font-semibold">2. Run Database Setup:</p>
              <p className="text-sm text-gray-600">
                Copy the SQL from supabase-setup.sql and run it in your Supabase SQL Editor
              </p>
              <a 
                href={`https://supabase.com/dashboard/project/${supabaseUrl?.split('.')[0].replace('https://', '')}/sql/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline text-sm"
              >
                Open SQL Editor →
              </a>
            </div>
          )}

          <div>
            <p className="font-semibold">3. Test Authentication:</p>
            <div className="flex gap-4 mt-2">
              <a 
                href="/auth/signup"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Sign Up
              </a>
              <a 
                href="/auth/signin"
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>

        {/* Raw Data */}
        <details className="border rounded-lg p-6">
          <summary className="cursor-pointer font-semibold">View Raw Response Data</summary>
          <pre className="mt-4 text-xs overflow-auto bg-gray-100 p-4 rounded">
            {JSON.stringify({
              auth: { session: session?.user?.email || null, error: authError?.message },
              database: { profiles: profiles?.length || 0, error: profileError?.message },
              config: { url: supabaseUrl, hasKeys: { anon: hasAnnonKey, service: hasServiceKey }}
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}