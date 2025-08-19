/**
 * BPMN API Client - Core routing backend client
 * Maintains exact compatibility with existing frontend
 * Can be swapped in without changing any UI code
 */

export interface DiagramData {
  id: string
  name: string
  bpmn_xml: string
  project_id?: string
  profile_id: string
  created_at: string
  updated_at: string
}

export class BpmnApiClient {
  private baseUrl = '/api/bpmn'

  /**
   * Get all diagrams for current user
   */
  async listDiagrams(): Promise<DiagramData[]> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list diagrams: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get specific diagram by ID
   */
  async getDiagram(id: string): Promise<DiagramData> {
    const response = await fetch(`${this.baseUrl}?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get diagram: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create new diagram
   */
  async createDiagram(data: {
    name: string
    bpmn_xml: string
    project_id?: string
  }): Promise<DiagramData> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to create diagram: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update existing diagram
   */
  async updateDiagram(id: string, data: {
    name?: string
    bpmn_xml?: string
  }): Promise<DiagramData> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, ...data })
    })

    if (!response.ok) {
      throw new Error(`Failed to update diagram: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete diagram
   */
  async deleteDiagram(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete diagram: ${response.statusText}`)
    }
  }

  /**
   * Export diagram in different formats
   */
  async exportDiagram(id: string, format: 'xml' | 'json' | 'svg' = 'xml'): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/export?id=${id}&format=${format}`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`Failed to export diagram: ${response.statusText}`)
    }

    return response
  }

  /**
   * Save or update diagram (convenience method)
   * Matches current frontend pattern
   */
  async saveDiagram(diagram: Partial<DiagramData> & { bpmn_xml: string }): Promise<DiagramData> {
    if (diagram.id) {
      // Update existing
      return this.updateDiagram(diagram.id, {
        name: diagram.name,
        bpmn_xml: diagram.bpmn_xml
      })
    } else {
      // Create new
      return this.createDiagram({
        name: diagram.name || `Diagram ${new Date().toLocaleString()}`,
        bpmn_xml: diagram.bpmn_xml,
        project_id: diagram.project_id
      })
    }
  }
}

// Singleton instance
export const bpmnApi = new BpmnApiClient()