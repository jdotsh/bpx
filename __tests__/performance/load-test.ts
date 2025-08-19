/**
 * Performance Testing Suite
 * Load testing, memory profiling, and scalability validation
 */

import { performance } from 'perf_hooks'

interface PerformanceMetrics {
  responseTime: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: NodeJS.CpuUsage
  timestamp: Date
}

export class PerformanceTest {
  private metrics: PerformanceMetrics[] = []
  private startTime: number = 0
  private startCpu: NodeJS.CpuUsage | null = null

  start() {
    this.startTime = performance.now()
    this.startCpu = process.cpuUsage()
    this.recordMetric()
  }

  recordMetric() {
    const currentTime = performance.now()
    const responseTime = currentTime - this.startTime
    const memoryUsage = process.memoryUsage()
    const cpuUsage = this.startCpu ? process.cpuUsage(this.startCpu) : process.cpuUsage()

    this.metrics.push({
      responseTime,
      memoryUsage,
      cpuUsage,
      timestamp: new Date()
    })
  }

  getReport() {
    const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length
    const maxMemory = Math.max(...this.metrics.map(m => m.memoryUsage.heapUsed))
    const avgCpu = this.metrics.reduce((sum, m) => sum + (m.cpuUsage.user + m.cpuUsage.system), 0) / this.metrics.length

    return {
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      maxMemoryUsed: `${(maxMemory / 1024 / 1024).toFixed(2)}MB`,
      avgCpuUsage: `${(avgCpu / 1000).toFixed(2)}ms`,
      totalRequests: this.metrics.length,
      metrics: this.metrics
    }
  }
}

// Load Test Scenarios
export async function runLoadTest(endpoint: string, concurrent: number = 10, requests: number = 100) {
  const test = new PerformanceTest()
  test.start()

  const promises = []
  for (let i = 0; i < requests; i++) {
    if (i % concurrent === 0 && i > 0) {
      // Wait for batch to complete
      await Promise.all(promises.splice(0, concurrent))
      test.recordMetric()
    }
    
    promises.push(fetch(endpoint).catch(err => ({ error: err.message })))
  }

  await Promise.all(promises)
  test.recordMetric()

  return test.getReport()
}

// Memory Leak Detection
export class MemoryLeakDetector {
  private samples: number[] = []
  private interval: NodeJS.Timer | null = null

  start(sampleInterval: number = 1000) {
    this.interval = setInterval(() => {
      const usage = process.memoryUsage()
      this.samples.push(usage.heapUsed)
    }, sampleInterval)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval as any)
      this.interval = null
    }
  }

  analyze(): { hasLeak: boolean; trend: string; samples: number[] } {
    if (this.samples.length < 10) {
      return { hasLeak: false, trend: 'insufficient data', samples: this.samples }
    }

    // Calculate trend using linear regression
    const n = this.samples.length
    const sumX = (n * (n - 1)) / 2
    const sumY = this.samples.reduce((a, b) => a + b, 0)
    const sumXY = this.samples.reduce((sum, y, x) => sum + x * y, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const avgGrowth = slope / (sumY / n) * 100

    return {
      hasLeak: avgGrowth > 5, // More than 5% growth indicates potential leak
      trend: `${avgGrowth.toFixed(2)}% growth per sample`,
      samples: this.samples
    }
  }
}

// Scalability Test
export async function testScalability(
  testFn: () => Promise<void>,
  scales: number[] = [1, 10, 50, 100, 500]
) {
  const results = []

  for (const scale of scales) {
    const test = new PerformanceTest()
    test.start()

    const promises = []
    for (let i = 0; i < scale; i++) {
      promises.push(testFn())
    }

    await Promise.all(promises)
    test.recordMetric()

    const report = test.getReport()
    results.push({
      scale,
      ...report
    })
  }

  return results
}

// Database Query Performance
export async function testDatabasePerformance(queries: Array<() => Promise<any>>) {
  const results = []

  for (const query of queries) {
    const startTime = performance.now()
    const startMemory = process.memoryUsage().heapUsed

    try {
      await query()
      const endTime = performance.now()
      const endMemory = process.memoryUsage().heapUsed

      results.push({
        success: true,
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        timestamp: new Date()
      })
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    }
  }

  return {
    totalQueries: queries.length,
    successRate: (results.filter(r => r.success).length / queries.length) * 100,
    avgDuration: results
      .filter(r => r.success && 'duration' in r)
      .reduce((sum, r) => sum + (r.duration || 0), 0) / results.length,
    results
  }
}

// Frontend Rendering Performance
export function measureRenderPerformance() {
  if (typeof window === 'undefined') {
    return null
  }

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const metrics = {
      FCP: 0, // First Contentful Paint
      LCP: 0, // Largest Contentful Paint
      FID: 0, // First Input Delay
      CLS: 0, // Cumulative Layout Shift
      TTFB: 0, // Time to First Byte
    }

    entries.forEach((entry) => {
      if (entry.entryType === 'paint') {
        if (entry.name === 'first-contentful-paint') {
          metrics.FCP = entry.startTime
        }
      }
      if (entry.entryType === 'largest-contentful-paint') {
        metrics.LCP = entry.startTime
      }
      if (entry.entryType === 'first-input') {
        metrics.FID = (entry as any).processingStart - entry.startTime
      }
      if (entry.entryType === 'layout-shift') {
        metrics.CLS += (entry as any).value
      }
      if (entry.entryType === 'navigation') {
        metrics.TTFB = (entry as any).responseStart
      }
    })

    console.log('Performance Metrics:', metrics)
    return metrics
  })

  observer.observe({ 
    entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] 
  })

  return observer
}