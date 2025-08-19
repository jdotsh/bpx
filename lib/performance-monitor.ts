export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number[]> = new Map()
  private enabled: boolean

  constructor(enabled: boolean = process.env.NODE_ENV === 'development') {
    this.enabled = enabled
  }

  mark(name: string): void {
    if (!this.enabled) return
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.enabled) return null

    const start = this.marks.get(startMark)
    const end = endMark ? this.marks.get(endMark) : performance.now()

    if (!start) return null

    const duration = (end || performance.now()) - start
    
    if (!this.measures.has(name)) {
      this.measures.set(name, [])
    }
    
    this.measures.get(name)?.push(duration)
    
    return duration
  }

  getAverageTime(measureName: string): number | null {
    const measures = this.measures.get(measureName)
    if (!measures || measures.length === 0) return null
    
    return measures.reduce((a, b) => a + b, 0) / measures.length
  }

  logMetrics(): void {
    if (!this.enabled) return
    
    console.group('Performance Metrics')
    this.measures.forEach((values, name) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      console.log(`${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`)
    })
    console.groupEnd()
  }

  clear(): void {
    this.marks.clear()
    this.measures.clear()
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor()