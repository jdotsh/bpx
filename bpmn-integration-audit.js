#!/usr/bin/env node

/**
 * BPMN.js Integration Audit Script
 * Analyzes BPMN integration for memory leaks, performance issues, and proper implementation
 */

import fs from 'fs/promises';
import path from 'path';

class BPMNIntegrationAuditor {
  constructor() {
    this.issues = [];
    this.findings = [];
  }

  logIssue(severity, component, message, recommendation = null) {
    this.issues.push({
      severity,
      component,
      message,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    const colors = {
      critical: '\x1b[31m',
      major: '\x1b[33m',
      minor: '\x1b[36m',
      info: '\x1b[37m'
    };
    
    console.log(`${colors[severity]}[${severity.toUpperCase()}] ${component}: ${message}\x1b[0m`);
    if (recommendation) {
      console.log(`  → Recommendation: ${recommendation}`);
    }
  }

  logFinding(category, finding) {
    this.findings.push({ category, finding, timestamp: new Date().toISOString() });
    console.log(`✓ ${category}: ${finding}`);
  }

  async analyzeFileContent(filePath, analysis) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return analysis(content, filePath);
    } catch (error) {
      this.logIssue('major', 'File Access', `Cannot read ${filePath}: ${error.message}`);
      return null;
    }
  }

  async auditBPMNDesigner() {
    console.log('\n=== BPMN Designer Core Analysis ===');
    
    const designerFiles = [
      'lib/bpmn-designer.ts',
      'lib/bpmn-designer-optimized.ts'
    ];
    
    for (const file of designerFiles) {
      const analysis = await this.analyzeFileContent(file, (content, path) => {
        const issues = [];
        
        // Check for memory leak patterns
        if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
          issues.push({
            type: 'memory_leak',
            message: 'Event listeners added but no cleanup detected',
            line: content.split('\n').findIndex(line => line.includes('addEventListener')) + 1
          });
        }
        
        // Check for proper disposal patterns
        if (content.includes('BpmnModeler') && !content.includes('destroy')) {
          issues.push({
            type: 'resource_leak',
            message: 'BPMN modeler instantiation without explicit cleanup',
            recommendation: 'Implement destroy() method to properly cleanup resources'
          });
        }
        
        // Check for proper error handling
        if (content.includes('importXML') && !content.includes('catch')) {
          issues.push({
            type: 'error_handling',
            message: 'BPMN XML import without proper error handling',
            recommendation: 'Wrap importXML calls in try-catch blocks'
          });
        }
        
        // Check for performance optimizations
        if (content.includes('getXml()') && !content.includes('getXmlSync')) {
          this.logFinding('Performance', 'Uses async XML export (good for performance)');
        }
        
        return issues;
      });
      
      if (analysis) {
        analysis.forEach(issue => {
          this.logIssue(
            issue.type === 'memory_leak' ? 'critical' : 
            issue.type === 'resource_leak' ? 'major' : 'minor',
            path.basename(file),
            issue.message,
            issue.recommendation
          );
        });
      }
    }
  }

  async auditReactComponents() {
    console.log('\n=== React BPMN Components Analysis ===');
    
    const componentFiles = [
      'components/bpmn/bpmn-canvas.tsx',
      'components/bpmn/bpmn-studio.tsx',
      'components/bpmn/bpmn-toolbar.tsx'
    ];
    
    for (const file of componentFiles) {
      const analysis = await this.analyzeFileContent(file, (content, path) => {
        const issues = [];
        
        // Check for useEffect cleanup
        const useEffectMatches = content.match(/useEffect\([^}]*\}/g) || [];
        const cleanupCount = (content.match(/return\s*\(\s*\)\s*=>/g) || []).length;
        
        if (useEffectMatches.length > cleanupCount) {
          issues.push({
            type: 'memory_leak',
            message: `${useEffectMatches.length} useEffect hooks but only ${cleanupCount} cleanup functions`,
            recommendation: 'Add cleanup functions to useEffect hooks, especially for BPMN modeler initialization'
          });
        }
        
        // Check for proper ref usage
        if (content.includes('useRef') && content.includes('current')) {
          this.logFinding('React Patterns', 'Uses refs for DOM manipulation (appropriate for BPMN)');
        }
        
        // Check for memoization
        if (content.includes('useMemo') || content.includes('useCallback')) {
          this.logFinding('Performance', 'Uses React performance optimizations');
        }
        
        // Check for proper state management
        if (content.includes('useState') && content.includes('BPMN')) {
          this.logFinding('State Management', 'Manages BPMN state in React');
        }
        
        return issues;
      });
      
      if (analysis) {
        analysis.forEach(issue => {
          this.logIssue(
            issue.type === 'memory_leak' ? 'critical' : 'minor',
            path.basename(file),
            issue.message,
            issue.recommendation
          );
        });
      }
    }
  }

  async auditPaletteImplementation() {
    console.log('\n=== Custom Palette Implementation Analysis ===');
    
    const paletteFiles = [
      'lib/custom-palette-provider.ts',
      'lib/custom-palette-module.ts',
      'components/bpmn/bpmn-elements-palette.tsx'
    ];
    
    for (const file of paletteFiles) {
      const analysis = await this.analyzeFileContent(file, (content, path) => {
        const issues = [];
        
        // Check for proper BPMN.js integration patterns
        if (content.includes('registerProvider')) {
          this.logFinding('BPMN Integration', 'Uses proper provider registration pattern');
        }
        
        // Check for drag-drop implementation
        if (content.includes('dragstart') || content.includes('drag')) {
          this.logFinding('Interaction', 'Implements drag-and-drop functionality');
        }
        
        // Check for tool vs element distinction
        if (content.includes('group') && content.includes('tools')) {
          this.logFinding('Palette Architecture', 'Distinguishes between tools and elements');
        } else {
          issues.push({
            type: 'architecture',
            message: 'Palette may not properly distinguish tools from elements',
            recommendation: 'Implement separate handling for tools (hand-tool, lasso-tool) vs elements'
          });
        }
        
        // Check for event handling patterns
        if (content.includes('palette.trigger') || content.includes('eventBus')) {
          this.logFinding('Event System', 'Uses BPMN.js event system');
        }
        
        return issues;
      });
      
      if (analysis) {
        analysis.forEach(issue => {
          this.logIssue('minor', path.basename(file), issue.message, issue.recommendation);
        });
      }
    }
  }

  async auditPerformancePatterns() {
    console.log('\n=== Performance Pattern Analysis ===');
    
    // Check for virtual rendering
    const virtualRendererExists = await fs.access('lib/virtual-renderer.ts').then(() => true).catch(() => false);
    if (virtualRendererExists) {
      this.logFinding('Performance', 'Implements virtual rendering for large diagrams');
    } else {
      this.logIssue('minor', 'Performance', 'No virtual rendering implementation found', 
        'Consider implementing virtual rendering for large BPMN diagrams');
    }
    
    // Check for performance monitoring
    const perfMonitorExists = await fs.access('lib/performance-monitor.ts').then(() => true).catch(() => false);
    if (perfMonitorExists) {
      this.logFinding('Monitoring', 'Has performance monitoring implementation');
    }
    
    // Check for auto-save optimization
    const autoSaveExists = await fs.access('lib/hooks/use-auto-save.ts').then(() => true).catch(() => false);
    if (autoSaveExists) {
      await this.analyzeFileContent('lib/hooks/use-auto-save.ts', (content) => {
        if (content.includes('debounce') || content.includes('throttle')) {
          this.logFinding('Auto-save', 'Implements debounced/throttled auto-save');
        } else {
          this.logIssue('minor', 'Auto-save', 'Auto-save may not be optimized', 
            'Consider debouncing auto-save to prevent excessive API calls');
        }
        return [];
      });
    }
  }

  async auditMemoryManagement() {
    console.log('\n=== Memory Management Analysis ===');
    
    const storeFile = 'lib/store/studio-store.ts';
    await this.analyzeFileContent(storeFile, (content, path) => {
      const issues = [];
      
      // Check for proper cleanup in store
      if (content.includes('cleanup') || content.includes('reset')) {
        this.logFinding('State Management', 'Store implements cleanup methods');
      } else {
        issues.push({
          type: 'memory_leak',
          message: 'Store may not properly cleanup state',
          recommendation: 'Implement cleanup methods for when components unmount'
        });
      }
      
      // Check for large state objects
      if (content.includes('bpmnXml') && !content.includes('compress')) {
        issues.push({
          type: 'memory_usage',
          message: 'Large BPMN XML stored in memory without compression',
          recommendation: 'Consider compressing large XML strings or using external storage'
        });
      }
      
      return issues;
    });
  }

  async auditSecurityPatterns() {
    console.log('\n=== Security Pattern Analysis ===');
    
    // Check validation patterns
    const validationFiles = ['lib/validations/diagram.ts'];
    
    for (const file of validationFiles) {
      await this.analyzeFileContent(file, (content, path) => {
        const issues = [];
        
        // Check for XML validation
        if (content.includes('bpmnXml') && !content.includes('max(')) {
          issues.push({
            type: 'security',
            message: 'BPMN XML validation may not have size limits',
            recommendation: 'Add maximum size validation for BPMN XML to prevent DoS attacks'
          });
        }
        
        // Check for metadata validation
        if (content.includes('metadata') && content.includes('strict')) {
          this.logFinding('Security', 'Uses strict metadata validation');
        }
        
        return issues;
      });
    }
    
    // Check for proper sanitization
    const utilsFile = 'lib/bpmn-utils.ts';
    await this.analyzeFileContent(utilsFile, (content, path) => {
      const issues = [];
      
      if (content.includes('DOMParser') && !content.includes('sanitize')) {
        issues.push({
          type: 'security',
          message: 'XML parsing without explicit sanitization',
          recommendation: 'Ensure XML content is properly sanitized before parsing'
        });
      }
      
      return issues;
    });
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('BPMN.js INTEGRATION AUDIT REPORT');
    console.log('='.repeat(80));
    
    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    const majorCount = this.issues.filter(i => i.severity === 'major').length;
    const minorCount = this.issues.filter(i => i.severity === 'minor').length;
    
    console.log('\nSUMMARY:');
    console.log(`- Critical Issues: ${criticalCount}`);
    console.log(`- Major Issues: ${majorCount}`);
    console.log(`- Minor Issues: ${minorCount}`);
    console.log(`- Positive Findings: ${this.findings.length}`);
    
    if (criticalCount > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.issues.filter(i => i.severity === 'critical').forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.component}: ${issue.message}`);
      });
    }
    
    if (majorCount > 0) {
      console.log('\n⚠️  MAJOR ISSUES:');
      this.issues.filter(i => i.severity === 'major').forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.component}: ${issue.message}`);
      });
    }
    
    if (this.findings.length > 0) {
      console.log('\n✅ POSITIVE FINDINGS:');
      this.findings.forEach((finding, i) => {
        console.log(`${i + 1}. ${finding.category}: ${finding.finding}`);
      });
    }
    
    // Write detailed report
    const reportPath = path.join(process.cwd(), 'bpmn-integration-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      summary: {
        critical: criticalCount,
        major: majorCount,
        minor: minorCount,
        findings: this.findings.length,
        timestamp: new Date().toISOString()
      },
      issues: this.issues,
      findings: this.findings
    }, null, 2));
    
    console.log(`\nDetailed report written to: ${reportPath}`);
    console.log('='.repeat(80));
    
    return criticalCount === 0 && majorCount <= 1;
  }

  async run() {
    console.log('Starting BPMN.js Integration Audit...\n');
    
    await this.auditBPMNDesigner();
    await this.auditReactComponents();
    await this.auditPaletteImplementation();
    await this.auditPerformancePatterns();
    await this.auditMemoryManagement();
    await this.auditSecurityPatterns();
    
    return await this.generateReport();
  }
}

// Run the audit
const auditor = new BPMNIntegrationAuditor();
auditor.run().then(isGood => {
  process.exit(isGood ? 0 : 1);
}).catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});