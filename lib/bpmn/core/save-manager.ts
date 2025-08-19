/**
 * Optimized Save Manager with Queue and Debouncing
 * Prevents save conflicts and optimizes performance
 */
export class SaveManager {
  private modeler: any
  private saveQueue: Promise<void> | null = null
  private lastSavedXml: string = ''
  private debouncedSave: (() => void) | null = null
  private debounceTimer: NodeJS.Timeout | null = null
  private saveInProgress = false
  
  constructor(
    modeler: any,
    private onSave?: (xml: string) => Promise<void> | void,
    private debounceMs: number = 500
  ) {
    this.modeler = modeler
    this.setupAutoSave()
  }

  private setupAutoSave(): void {
    const eventBus = this.modeler.get('eventBus')
    
    // Create debounced save function
    this.debouncedSave = () => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      
      this.debounceTimer = setTimeout(() => {
        this.save()
      }, this.debounceMs)
    }
    
    // Listen for changes
    eventBus.on('commandStack.changed', () => {
      if (this.debouncedSave) {
        this.debouncedSave()
      }
    })
    
    // Also save on import
    eventBus.on('import.done', () => {
      // Save immediately after import to capture initial state
      this.saveNow()
    })
  }

  private async save(): Promise<void> {
    // If save is already in progress, queue the next one
    if (this.saveQueue) {
      // Wait for current save to complete, then save again
      return this.saveQueue.then(() => {
        // Check if we still need to save
        if (!this.saveInProgress) {
          return this.save()
        }
      })
    }
    
    this.saveQueue = this.performSave()
    
    try {
      await this.saveQueue
    } finally {
      this.saveQueue = null
    }
  }

  private async performSave(): Promise<void> {
    if (this.saveInProgress) {
      return
    }
    
    this.saveInProgress = true
    
    try {
      const { xml } = await this.modeler.saveXML({ format: true })
      
      // Only save if XML has changed
      if (xml === this.lastSavedXml) {
        return
      }
      
      this.lastSavedXml = xml
      
      // Call the save callback
      if (this.onSave) {
        await this.onSave(xml)
      }
      
      // Emit save event
      const eventBus = this.modeler.get('eventBus')
      eventBus.fire('diagram.saved', { xml })
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Diagram saved (${xml.length} bytes)`)
      }
    } catch (error) {
      console.error('Failed to save diagram:', error)
      
      // Emit error event
      const eventBus = this.modeler.get('eventBus')
      eventBus.fire('diagram.saveError', { error })
      
      throw error
    } finally {
      this.saveInProgress = false
    }
  }

  /**
   * Save immediately, bypassing debounce
   */
  public async saveNow(): Promise<string> {
    // Cancel any pending debounced saves
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    
    await this.save()
    return this.lastSavedXml
  }

  /**
   * Get the last saved XML without triggering a save
   */
  public getLastSavedXml(): string {
    return this.lastSavedXml
  }

  /**
   * Check if there are unsaved changes
   */
  public async hasUnsavedChanges(): Promise<boolean> {
    try {
      const { xml } = await this.modeler.saveXML({ format: true })
      return xml !== this.lastSavedXml
    } catch (error) {
      return false
    }
  }

  /**
   * Update debounce delay
   */
  public setDebounceDelay(ms: number): void {
    this.debounceMs = ms
  }

  /**
   * Destroy and cleanup
   */
  public destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    const eventBus = this.modeler.get('eventBus')
    eventBus.off('commandStack.changed')
    eventBus.off('import.done')
    
    this.debouncedSave = null
    this.saveQueue = null
  }
}