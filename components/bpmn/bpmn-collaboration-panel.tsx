// BPMN Collaboration Panel - Real-time Collaboration
// Complete BPMN Studio MVP

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, UserPlus, Crown, Edit3, Eye, Trash2, Mail } from 'lucide-react'

interface Collaborator {
  userId: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  joinedAt: string
  user: {
    name?: string
    email: string
    avatarUrl?: string
  }
}

interface CollaborationPanelProps {
  projectId: string
  collaborators: Collaborator[]
  userRole: string
  onInvite?: (email: string, role: string) => void
  onRoleChange?: (userId: string, role: string) => void
  onRemove?: (userId: string) => void
}

export function BpmnCollaborationPanel({ 
  projectId, 
  collaborators, 
  userRole,
  onInvite,
  onRoleChange,
  onRemove 
}: CollaborationPanelProps) {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER')
  const [loading, setLoading] = useState(false)

  const canManageCollaborators = userRole === 'OWNER' || userRole === 'EDITOR'

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !onInvite) return
    
    setLoading(true)
    try {
      await onInvite(inviteEmail.trim(), inviteRole)
      setInviteEmail('')
      setShowInvite(false)
    } catch (error) {
      console.error('Failed to invite collaborator:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'OWNER', label: 'Owner', icon: Crown, description: 'Full access, can delete project' },
    { value: 'EDITOR', label: 'Editor', icon: Edit3, description: 'Can edit diagrams and invite others' },
    { value: 'VIEWER', label: 'Viewer', icon: Eye, description: 'Can view diagrams only' }
  ]

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'text-purple-600 bg-purple-100'
      case 'EDITOR': return 'text-blue-600 bg-blue-100'
      case 'VIEWER': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Collaborators
          </div>
          {canManageCollaborators && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {collaborators.length} {collaborators.length === 1 ? 'member' : 'members'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Invite Form */}
        {showInvite && (
          <div className="mb-4 p-3 border rounded-lg bg-gray-50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleInvite}
                  disabled={loading || !inviteEmail.trim()}
                  className="flex-1"
                >
                  {loading ? 'Inviting...' : 'Send Invite'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowInvite(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Collaborators List */}
        <div className="space-y-3">
          {collaborators.map((collaborator) => {
            const RoleIcon = roleOptions.find(r => r.value === collaborator.role)?.icon || Users
            
            return (
              <div key={collaborator.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                    {collaborator.user.avatarUrl ? (
                      <img 
                        src={collaborator.user.avatarUrl} 
                        alt={collaborator.user.name || collaborator.user.email}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      getInitials(collaborator.user.name, collaborator.user.email)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {collaborator.user.name || collaborator.user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {collaborator.user.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(collaborator.role)}`}>
                    <RoleIcon className="h-3 w-3 inline mr-1" />
                    {collaborator.role.toLowerCase()}
                  </span>
                  
                  {canManageCollaborators && collaborator.role !== 'OWNER' && (
                    <div className="flex items-center space-x-1">
                      {onRoleChange && (
                        <select
                          value={collaborator.role}
                          onChange={(e) => onRoleChange(collaborator.userId, e.target.value)}
                          className="text-xs border rounded px-1 py-0.5"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                        </select>
                      )}
                      {onRemove && userRole === 'OWNER' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemove(collaborator.userId)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {collaborators.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No collaborators yet</p>
            {canManageCollaborators && (
              <p className="text-xs mt-1">Invite team members to collaborate</p>
            )}
          </div>
        )}

        {/* Role Descriptions */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Permission Levels</h4>
          <div className="space-y-1">
            {roleOptions.map((role) => {
              const Icon = role.icon
              return (
                <div key={role.value} className="text-xs text-gray-600 flex items-start">
                  <Icon className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>{role.label}:</strong> {role.description}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}