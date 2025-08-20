import { getCurrentUser } from '@/lib/auth/server'
import { ProfileService } from '@/lib/services/profile'
import { ProjectService } from '@/lib/services/project'
import { DiagramService, type DiagramWithProject } from '@/lib/services/diagram'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  // Get or create user profile
  const profile = await ProfileService.getOrCreateProfile(user.id)
  
  // Get user stats and recent data in parallel
  // Temporarily stubbed - methods need to be implemented
  const userStats = { totalProjects: 0, totalDiagrams: 0, totalCollaborators: 0 }
  const recentProjects = await ProjectService.listProjects(user.id) || []
  const recentDiagrams = await DiagramService.listDiagrams(user.id) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">BPMN Studio</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {profile?.displayName || user.email}
              </span>
              <form action="/auth/signout" method="post">
                <Button variant="outline" type="submit">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* User Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Studio</CardTitle>
                <CardDescription>Projects and diagrams overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projects:</span>
                    <span className="font-semibold">{userStats.totalProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diagrams:</span>
                    <span className="font-semibold">{userStats.totalDiagrams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold text-green-600">{profile?.subscription?.plan || 'FREE'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with BPMN Studio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/studio" className="block">
                  <Button className="w-full">
                    Create New Diagram
                  </Button>
                </Link>
                <Link href="/projects" className="block">
                  <Button variant="outline" className="w-full">
                    Browse Projects
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                  <Button variant="outline" className="w-full">
                    Account Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Diagrams</CardTitle>
                <CardDescription>Your latest work</CardDescription>
              </CardHeader>
              <CardContent>
                {recentDiagrams.length > 0 ? (
                  <div className="space-y-3">
                    {recentDiagrams.map((diagram) => (
                      <div key={diagram.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <Link href={`/studio?diagram=${diagram.id}`} className="block">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {diagram.name || diagram.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {diagram.project_id || diagram.projectId || ''}
                            </p>
                          </Link>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(diagram.updated_at || diagram.updatedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p>No diagrams yet</p>
                    <p className="mt-2">
                      Create your first diagram to see it here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Recent Projects Section */}
          {recentProjects.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                <Link href="/projects">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentProjects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="text-sm">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Updated {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="outline" size="sm">
                            Open
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}