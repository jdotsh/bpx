#!/usr/bin/env node

/**
 * Architecture Quality Analysis for BPMN Studio
 * Analyzes code quality, patterns, scalability, and architectural decisions
 */

import fs from 'fs/promises';
import path from 'path';

class ArchitectureAnalyzer {
  constructor() {
    this.issues = [];
    this.strengths = [];
    this.metrics = {
      codeComplexity: 0,
      separationOfConcerns: 0,
      errorHandling: 0,
      performance: 0,
      scalability: 0
    };
  }

  logIssue(severity, category, description, impact, recommendation, file = null) {
    this.issues.push({
      severity,
      category,
      description,
      impact,
      recommendation,
      file,
      timestamp: new Date().toISOString()
    });
    
    const colors = {
      critical: '\x1b[31m',
      major: '\x1b[33m',
      minor: '\x1b[36m'
    };
    
    console.log(`${colors[severity]}[${severity.toUpperCase()}] ${category}: ${description}\x1b[0m`);
    if (file) console.log(`  File: ${file}`);
    console.log(`  Impact: ${impact}`);
    console.log(`  Fix: ${recommendation}`);
  }

  logStrength(category, description, file = null) {
    this.strengths.push({ category, description, file, timestamp: new Date().toISOString() });
    console.log(`✅ ${category}: ${description}`);
    if (file) console.log(`  File: ${file}`);
  }

  async analyzeFile(filePath, analyzer) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return analyzer(content, filePath);
    } catch (error) {
      return null;
    }
  }

  async analyzeServiceLayer() {
    console.log('\n=== Service Layer Architecture Analysis ===');
    
    const serviceFiles = [
      'lib/services/diagram.ts',
      'lib/services/project.ts',
      'lib/services/profile.ts'
    ];
    
    let serviceQuality = 0;
    let serviceCount = 0;
    
    for (const file of serviceFiles) {
      const analysis = await this.analyzeFile(file, (content, filePath) => {
        let quality = 0;
        
        // Check for proper class structure
        if (content.includes('export class') && content.includes('Service')) {
          this.logStrength('Service Layer', 'Uses proper service class pattern', path.basename(filePath));
          quality += 20;
        }
        
        // Check for static methods (stateless services)
        if (content.includes('static async')) {
          this.logStrength('Service Layer', 'Uses stateless service methods', path.basename(filePath));
          quality += 15;
        }
        
        // Check for proper error handling
        const tryCount = (content.match(/try\s*{/g) || []).length;
        const catchCount = (content.match(/catch\s*\(/g) || []).length;
        
        if (tryCount === catchCount && tryCount > 0) {
          this.logStrength('Error Handling', 'Consistent try-catch error handling', path.basename(filePath));
          quality += 15;
        } else if (tryCount > catchCount) {
          this.logIssue(
            'major',
            'Error Handling',
            'Inconsistent error handling patterns',
            'Could lead to unhandled exceptions and application crashes',
            'Ensure all try blocks have corresponding catch blocks',
            path.basename(filePath)
          );
        }
        
        // Check for database query optimization
        if (content.includes('select:') || content.includes('include:')) {
          this.logStrength('Database Optimization', 'Uses selective field querying', path.basename(filePath));
          quality += 10;
        }
        
        // Check for pagination
        if (content.includes('take:') && content.includes('skip:')) {
          this.logStrength('Scalability', 'Implements pagination', path.basename(filePath));
          quality += 10;
        }
        
        // Check for input validation
        if (content.includes('Input') && content.includes('schema')) {
          this.logStrength('Validation', 'Uses input validation schemas', path.basename(filePath));
          quality += 15;
        }
        
        // Check for proper return types
        if (content.includes('Promise<') && content.includes('| null')) {
          this.logStrength('Type Safety', 'Uses proper return types with null handling', path.basename(filePath));
          quality += 15;
        }
        
        return quality;
      });
      
      if (analysis !== null) {
        serviceQuality += analysis;
        serviceCount++;
      }
    }
    
    this.metrics.separationOfConcerns = serviceCount > 0 ? serviceQuality / serviceCount : 0;
  }

  async analyzeAPIRoutes() {
    console.log('\n=== API Route Architecture Analysis ===');
    
    const apiFiles = await this.findFiles('app/api', 'route.ts');
    let routeQuality = 0;
    let routeCount = 0;
    
    for (const file of apiFiles.slice(0, 10)) { // Limit analysis
      const analysis = await this.analyzeFile(file, (content, filePath) => {
        let quality = 0;
        
        // Check for proper HTTP method handling
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter(method =>
          content.includes(`export async function ${method}`)
        );
        
        if (methods.length > 0) {
          this.logStrength('API Design', `Implements ${methods.join(', ')} methods`, path.basename(filePath));
          quality += 10 * methods.length;
        }
        
        // Check for authentication
        if (content.includes('getCurrentUser') || content.includes('getSession')) {
          this.logStrength('Security', 'Implements authentication checks', path.basename(filePath));
          quality += 20;
        } else {
          this.logIssue(
            'major',
            'Security',
            'Missing authentication in API route',
            'Could allow unauthorized access to sensitive data',
            'Add authentication checks to all protected routes',
            path.basename(filePath)
          );
        }
        
        // Check for input validation
        if (content.includes('.parse(') && content.includes('schema')) {
          this.logStrength('Validation', 'Validates input data', path.basename(filePath));
          quality += 15;
        }
        
        // Check for proper error responses
        if (content.includes('NextResponse.json') && content.includes('status:')) {
          this.logStrength('API Design', 'Uses proper HTTP status codes', path.basename(filePath));
          quality += 15;
        }
        
        // Check for logging
        if (content.includes('console.error') || content.includes('logger')) {
          this.logStrength('Debugging', 'Implements error logging', path.basename(filePath));
          quality += 10;
        }
        
        return quality;
      });
      
      if (analysis !== null) {
        routeQuality += analysis;
        routeCount++;
      }
    }
    
    this.metrics.errorHandling = routeCount > 0 ? routeQuality / routeCount : 0;
  }

  async analyzeComponentArchitecture() {
    console.log('\n=== React Component Architecture Analysis ===');
    
    const componentFiles = await this.findFiles('components', '.tsx');
    let componentQuality = 0;
    let componentCount = 0;
    
    for (const file of componentFiles.slice(0, 15)) { // Limit analysis
      const analysis = await this.analyzeFile(file, (content, filePath) => {
        let quality = 0;
        
        // Check for proper TypeScript interfaces
        if (content.includes('interface') && content.includes('Props')) {
          this.logStrength('Type Safety', 'Uses TypeScript prop interfaces', path.basename(filePath));
          quality += 15;
        }
        
        // Check for proper component composition
        if (content.includes('children') && content.includes('ReactNode')) {
          this.logStrength('Component Design', 'Supports composition pattern', path.basename(filePath));
          quality += 10;
        }
        
        // Check for performance optimizations
        if (content.includes('useMemo') || content.includes('useCallback')) {
          this.logStrength('Performance', 'Uses React performance optimizations', path.basename(filePath));
          quality += 15;
        }
        
        // Check for proper state management
        const useStateCount = (content.match(/useState/g) || []).length;
        if (useStateCount > 5) {
          this.logIssue(
            'minor',
            'State Management',
            'Component has many state variables',
            'Could indicate component is too complex or needs state consolidation',
            'Consider using useReducer or lifting state up',
            path.basename(filePath)
          );
        } else if (useStateCount > 0) {
          quality += 10;
        }
        
        // Check for accessibility
        if (content.includes('aria-') || content.includes('role=')) {
          this.logStrength('Accessibility', 'Implements accessibility attributes', path.basename(filePath));
          quality += 10;
        }
        
        // Check for error boundaries
        if (content.includes('ErrorBoundary') || content.includes('componentDidCatch')) {
          this.logStrength('Error Handling', 'Uses error boundaries', path.basename(filePath));
          quality += 20;
        }
        
        return quality;
      });
      
      if (analysis !== null) {
        componentQuality += analysis;
        componentCount++;
      }
    }
    
    this.metrics.codeComplexity = componentCount > 0 ? componentQuality / componentCount : 0;
  }

  async analyzePerformancePatterns() {
    console.log('\n=== Performance Architecture Analysis ===');
    
    let performanceScore = 0;
    
    // Check for Next.js optimization patterns
    await this.analyzeFile('next.config.js', (content, filePath) => {
      if (content.includes('experimental') && content.includes('optimizePackageImports')) {
        this.logStrength('Performance', 'Uses Next.js package import optimization');
        performanceScore += 20;
      }
      
      if (content.includes('compress') || content.includes('gzip')) {
        this.logStrength('Performance', 'Enables compression');
        performanceScore += 15;
      }
      
      if (content.includes('images') && content.includes('domains')) {
        this.logStrength('Performance', 'Configures image optimization');
        performanceScore += 15;
      }
      
      return performanceScore;
    });
    
    // Check for bundle optimization
    const packageJson = await this.analyzeFile('package.json', (content, filePath) => {
      const pkg = JSON.parse(content);
      
      if (pkg.scripts && pkg.scripts['build:analyze']) {
        this.logStrength('Performance', 'Includes bundle analysis script');
        performanceScore += 10;
      }
      
      // Check for potential performance issues
      const heavyPackages = [
        'lodash',
        'moment', 
        'react-dom/server'
      ];
      
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      heavyPackages.forEach(pkg => {
        if (dependencies[pkg]) {
          this.logIssue(
            'minor',
            'Performance',
            `Uses potentially heavy package: ${pkg}`,
            'Could increase bundle size significantly',
            `Consider lighter alternatives or optimize usage of ${pkg}`
          );
        }
      });
      
      return performanceScore;
    });
    
    // Check for caching strategies
    const cacheFiles = ['lib/cache.ts', 'lib/redis.ts'];
    for (const file of cacheFiles) {
      await this.analyzeFile(file, (content, filePath) => {
        if (content.includes('cache') || content.includes('redis')) {
          this.logStrength('Performance', 'Implements caching strategy', path.basename(filePath));
          performanceScore += 20;
        }
        return 0;
      });
    }
    
    this.metrics.performance = performanceScore;
  }

  async analyzeScalabilityPatterns() {
    console.log('\n=== Scalability Architecture Analysis ===');
    
    let scalabilityScore = 0;
    
    // Check database patterns
    await this.analyzeFile('prisma/schema.prisma', (content, filePath) => {
      // Check for proper indexing
      const indexCount = (content.match(/@@index/g) || []).length;
      if (indexCount > 5) {
        this.logStrength('Scalability', `Database has ${indexCount} indexes for query optimization`);
        scalabilityScore += 25;
      }
      
      // Check for foreign key constraints
      if (content.includes('onDelete: Cascade')) {
        this.logStrength('Data Integrity', 'Uses proper foreign key cascade handling');
        scalabilityScore += 15;
      }
      
      // Check for soft deletes
      if (content.includes('deletedAt')) {
        this.logStrength('Scalability', 'Implements soft delete pattern');
        scalabilityScore += 10;
      }
      
      return 0;
    });
    
    // Check for environment-specific configurations
    const envFiles = ['.env.example', '.env.local'];
    for (const file of envFiles) {
      await this.analyzeFile(file, (content, filePath) => {
        if (content.includes('DATABASE_URL') && content.includes('REDIS')) {
          this.logStrength('Scalability', 'Supports external database and caching', path.basename(filePath));
          scalabilityScore += 15;
        }
        return 0;
      });
    }
    
    // Check for rate limiting
    await this.analyzeFile('lib/services/rate-limiter.ts', (content, filePath) => {
      if (content.includes('rateLimit') || content.includes('upstash')) {
        this.logStrength('Scalability', 'Implements rate limiting');
        scalabilityScore += 20;
      }
      return 0;
    });
    
    this.metrics.scalability = scalabilityScore;
  }

  async analyzeCodeSmells() {
    console.log('\n=== Code Smell Detection ===');
    
    const codeFiles = await this.findFiles('.', '.ts');
    const smellPatterns = [
      {
        pattern: /console\.log/g,
        severity: 'minor',
        message: 'Debug console.log statements found',
        recommendation: 'Remove debug statements or use proper logging'
      },
      {
        pattern: /any/g,
        severity: 'minor',
        message: 'TypeScript any type usage',
        recommendation: 'Use specific types instead of any'
      },
      {
        pattern: /TODO|FIXME|XXX/g,
        severity: 'minor',
        message: 'TODO/FIXME comments found',
        recommendation: 'Address pending issues before production'
      }
    ];
    
    for (const file of codeFiles.slice(0, 20)) { // Limit analysis
      await this.analyzeFile(file, (content, filePath) => {
        smellPatterns.forEach(smell => {
          const matches = content.match(smell.pattern);
          if (matches && matches.length > 3) { // Only report if significant occurrences
            this.logIssue(
              smell.severity,
              'Code Quality',
              `${smell.message} (${matches.length} occurrences)`,
              'Could indicate maintenance issues or technical debt',
              smell.recommendation,
              path.basename(filePath)
            );
          }
        });
        return 0;
      });
    }
  }

  async findFiles(dir, extension) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !['node_modules', '.git', '.next'].includes(entry.name)) {
          files.push(...await this.findFiles(fullPath, extension));
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory access error
    }
    return files;
  }

  calculateOverallScore() {
    const weights = {
      separationOfConcerns: 0.25,
      errorHandling: 0.20,
      codeComplexity: 0.20,
      performance: 0.20,
      scalability: 0.15
    };
    
    return Math.round(
      this.metrics.separationOfConcerns * weights.separationOfConcerns +
      this.metrics.errorHandling * weights.errorHandling +
      this.metrics.codeComplexity * weights.codeComplexity +
      this.metrics.performance * weights.performance +
      this.metrics.scalability * weights.scalability
    );
  }

  async generateArchitectureReport() {
    console.log('\n' + '='.repeat(80));
    console.log('ARCHITECTURE QUALITY ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    const majorCount = this.issues.filter(i => i.severity === 'major').length;
    const minorCount = this.issues.filter(i => i.severity === 'minor').length;
    
    const overallScore = this.calculateOverallScore();
    
    console.log('\nARCHITECTURE METRICS:');
    console.log(`- Separation of Concerns: ${Math.round(this.metrics.separationOfConcerns)}/100`);
    console.log(`- Error Handling: ${Math.round(this.metrics.errorHandling)}/100`);
    console.log(`- Code Complexity: ${Math.round(this.metrics.codeComplexity)}/100`);
    console.log(`- Performance: ${Math.round(this.metrics.performance)}/100`);
    console.log(`- Scalability: ${Math.round(this.metrics.scalability)}/100`);
    console.log(`\n📊 OVERALL ARCHITECTURE SCORE: ${overallScore}/100`);
    
    console.log('\nISSUE SUMMARY:');
    console.log(`- Critical Issues: ${criticalCount}`);
    console.log(`- Major Issues: ${majorCount}`);
    console.log(`- Minor Issues: ${minorCount}`);
    console.log(`- Architectural Strengths: ${this.strengths.length}`);
    
    if (criticalCount > 0) {
      console.log('\n🚨 CRITICAL ARCHITECTURAL ISSUES:');
      this.issues.filter(i => i.severity === 'critical').forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.category}: ${issue.description}`);
      });
    }
    
    if (majorCount > 0) {
      console.log('\n⚠️  MAJOR ARCHITECTURAL ISSUES:');
      this.issues.filter(i => i.severity === 'major').forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.category}: ${issue.description}`);
      });
    }
    
    if (overallScore >= 80) {
      console.log('\n✅ EXCELLENT: Architecture follows best practices');
    } else if (overallScore >= 65) {
      console.log('\n👍 GOOD: Solid architecture with some improvements needed');
    } else if (overallScore >= 50) {
      console.log('\n⚠️  FAIR: Architecture needs significant improvements');
    } else {
      console.log('\n❌ POOR: Major architectural issues need immediate attention');
    }
    
    // Write detailed report
    const reportPath = path.join(process.cwd(), 'architecture-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      summary: {
        overallScore,
        metrics: this.metrics,
        critical: criticalCount,
        major: majorCount,
        minor: minorCount,
        strengths: this.strengths.length,
        timestamp: new Date().toISOString()
      },
      issues: this.issues,
      strengths: this.strengths
    }, null, 2));
    
    console.log(`\nDetailed report written to: ${reportPath}`);
    console.log('='.repeat(80));
    
    return overallScore >= 65;
  }

  async run() {
    console.log('Starting Architecture Quality Analysis...\n');
    
    await this.analyzeServiceLayer();
    await this.analyzeAPIRoutes();
    await this.analyzeComponentArchitecture();
    await this.analyzePerformancePatterns();
    await this.analyzeScalabilityPatterns();
    await this.analyzeCodeSmells();
    
    return await this.generateArchitectureReport();
  }
}

// Run the architecture analysis
const analyzer = new ArchitectureAnalyzer();
analyzer.run().then(isGood => {
  process.exit(isGood ? 0 : 1);
}).catch(error => {
  console.error('Architecture analysis failed:', error);
  process.exit(1);
});