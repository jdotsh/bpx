import { createClient } from '@/lib/auth/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface DiagramData {
  id?: string
  name: string
  bpmn_xml: string
  project_id?: string | null
  profile_id?: string
  thumbnail?: string | null
  version?: number
  created_at?: string
  updated_at?: string
}

export class BpmnBackendAdapter {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient()
  }

  async saveDiagram(data: {
    id?: string
    name: string
    bpmn_xml: string
    project_id?: string | null
  }): Promise<DiagramData> {
    const { data: userData } = await this.supabase.auth.getUser()
    if (!userData.user) {
      throw new Error('Not authenticated')
    }

    if (data.id) {
      // Update existing diagram
      const { data: diagram, error } = await this.supabase
        .from('diagrams')
        .update({
          name: data.name,
          bpmn_xml: data.bpmn_xml,
          updated_at: new Date().toISOString(),
          version: this.supabase.rpc('increment', { row_id: data.id })
        })
        .eq('id', data.id)
        .select()
        .single()

      if (error) throw error
      return diagram
    } else {
      // Create new diagram
      const { data: diagram, error } = await this.supabase
        .from('diagrams')
        .insert({
          name: data.name,
          bpmn_xml: data.bpmn_xml,
          project_id: data.project_id,
          profile_id: userData.user.id
        })
        .select()
        .single()

      if (error) throw error
      return diagram
    }
  }

  async loadDiagram(id: string): Promise<DiagramData> {
    const { data, error } = await this.supabase
      .from('diagrams')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async listDiagrams(projectId?: string): Promise<DiagramData[]> {
    let query = this.supabase
      .from('diagrams')
      .select('id, name, created_at, updated_at, project_id, version')
      .order('updated_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async deleteDiagram(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('diagrams')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async generateThumbnail(xml: string): Promise<string> {
    // For now, return a placeholder
    // In production, you'd generate an actual thumbnail from the BPMN XML
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CUE1OIERpYWdyYW08L3RleHQ+PC9zdmc+'
  }

  // Auto-save functionality with debouncing
  private autoSaveTimer: NodeJS.Timeout | null = null

  async autoSaveDiagram(
    id: string,
    xml: string,
    name: string,
    delay: number = 5000
  ): Promise<void> {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }

    // Set new timer
    this.autoSaveTimer = setTimeout(async () => {
      try {
        await this.saveDiagram({
          id,
          name,
          bpmn_xml: xml
        })
        console.log('Auto-saved diagram')
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, delay)
  }

  cleanup(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }
  }
}