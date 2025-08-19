// Individual Project Page
// Complete BPMN Studio MVP

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileText, Calendar, Edit3, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  updatedAt: string
  version: number
  diagramCount: number
  collaborators?: Array<{
    userId: string
    role: string
    user: {
      name?: string
      email: string
    }
  }>
}

interface Diagram {
  id: string
  title: string
  updatedAt: string
  version: number
  projectId: string
  thumbnailUrl?: string
  lastEditor?: string
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [diagrams, setDiagrams] = useState<Diagram[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else if (response.status === 404) {
        router.push('/projects')
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    }
  }, [params.id, router])

  const fetchDiagrams = useCallback(async () => {
    try {
      const response = await fetch(`/api/diagrams?projectId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setDiagrams(data)
      }
    } catch (error) {
      console.error('Failed to fetch diagrams:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchProject()
    fetchDiagrams()
  }, [params.id, fetchProject, fetchDiagrams])

  const createDiagram = async (title: string) => {
    try {
      const defaultBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

      const response = await fetch('/api/diagrams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: params.id,
          title,
          bpmnXml: defaultBpmn
        })
      })
      
      if (response.ok) {
        const diagram = await response.json()
        setDiagrams(prev => [diagram, ...prev])
        setShowCreateModal(false)
        router.push(`/studio?diagramId=${diagram.id}`)
      }
    } catch (error) {
      console.error('Failed to create diagram:', error)
    }
  }

  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{diagrams.length}</p>
                    <p className="text-gray-600">Diagrams</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-gray-600">{new Date(project.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Edit3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium">Version</p>
                    <p className="text-gray-600">v{project.version}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Create */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search diagrams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Diagram
            </Button>
          </div>

          {/* Diagrams Grid */}
          {filteredDiagrams.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No diagrams found' : 'No diagrams yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Create your first diagram to start modeling.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Diagram
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDiagrams.map((diagram) => (
                <Card key={diagram.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href={`/studio?diagramId=${diagram.id}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">{diagram.title}</CardTitle>
                      <CardDescription>
                        Version {diagram.version}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(diagram.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {diagram.lastEditor && (
                          <span className="text-xs">by {diagram.lastEditor}</span>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Diagram Modal */}
      {showCreateModal && (
        <CreateDiagramModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createDiagram}
        />
      )}
    </div>
  )
}

function CreateDiagramModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void
  onSubmit: (title: string) => void 
}) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await onSubmit(title.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Diagram</CardTitle>
          <CardDescription>
            Start a new BPMN diagram
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Diagram Title *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Process Diagram"
                required
                disabled={loading}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? 'Creating...' : 'Create Diagram'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}