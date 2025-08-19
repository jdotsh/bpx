#!/usr/bin/env node

/**
 * BPMN Studio Production Readiness Audit
 * Comprehensive validation script for production deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class ProductionReadinessAuditor {
  constructor() {
    this.results = {
      critical: [],
      major: [],
      minor: [],
      passed: []
    };
    this.startTime = Date.now();
  }

  log(level, title, message, details = null) {
    const result = { title, message, details, timestamp: new Date().toISOString() };
    this.results[level].push(result);
    
    const colors = {
      critical: '\x1b[31m', // Red
      major: '\x1b[33m',    // Yellow
      minor: '\x1b[36m',    // Cyan
      passed: '\x1b[32m'    // Green
    };
    
    console.log(`${colors[level]}[${level.toUpperCase()}] ${title}: ${message}\x1b[0m`);
    if (details) console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
  }

  async runCommand(command, description) {
    try {
      console.log(`\nRunning: ${description}`);
      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
      return { success: true, stdout, stderr };
    } catch (error) {
      return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
    }
  }

  async checkTypeScriptCompilation() {
    console.log('\n=== TypeScript Compilation Check ===');
    
    const result = await this.runCommand('npm run type-check', 'TypeScript type checking');
    
    if (!result.success) {
      this.log('critical', 'TypeScript Compilation', 'TypeScript compilation failed', {
        errorCount: (result.stderr?.match(/error TS/g) || []).length,
        errors: result.stderr
      });
      return false;
    } else {
      this.log('passed', 'TypeScript Compilation', 'All TypeScript checks passed');
      return true;
    }
  }

  async checkBuildProcess() {
    console.log('\n=== Build Process Check ===');
    
    const result = await this.runCommand('npm run build', 'Next.js production build');
    
    if (!result.success) {
      this.log('critical', 'Build Process', 'Production build failed', {
        error: result.error,
        stderr: result.stderr
      });
      return false;
    }
    
    // Check bundle sizes
    try {
      const buildDir = path.join(process.cwd(), '.next');
      const stats = await fs.stat(buildDir);
      this.log('passed', 'Build Process', 'Production build completed successfully');
      
      // Analyze bundle size if build succeeded
      const analyzeResult = await this.runCommand('npm run build:analyze', 'Bundle analysis');
      if (analyzeResult.success) {
        this.log('passed', 'Bundle Analysis', 'Bundle analysis completed');
      }
      
      return true;
    } catch (error) {
      this.log('major', 'Build Output', 'Could not verify build output', { error: error.message });
      return false;
    }
  }

  async checkDependencyVulnerabilities() {
    console.log('\n=== Dependency Vulnerability Check ===');
    
    const auditResult = await this.runCommand('npm audit --json', 'NPM security audit');
    
    if (auditResult.success) {
      try {
        const auditData = JSON.parse(auditResult.stdout);
        const vulnerabilities = auditData.vulnerabilities || {};
        const criticalCount = Object.values(vulnerabilities).filter(v => v.severity === 'critical').length;
        const highCount = Object.values(vulnerabilities).filter(v => v.severity === 'high').length;
        const moderateCount = Object.values(vulnerabilities).filter(v => v.severity === 'moderate').length;
        
        if (criticalCount > 0) {
          this.log('critical', 'Security Vulnerabilities', `${criticalCount} critical vulnerabilities found`, {
            critical: criticalCount,
            high: highCount,
            moderate: moderateCount
          });
        } else if (highCount > 0) {
          this.log('major', 'Security Vulnerabilities', `${highCount} high severity vulnerabilities found`, {
            high: highCount,
            moderate: moderateCount
          });
        } else if (moderateCount > 0) {
          this.log('minor', 'Security Vulnerabilities', `${moderateCount} moderate vulnerabilities found`, {
            moderate: moderateCount
          });
        } else {
          this.log('passed', 'Security Vulnerabilities', 'No known vulnerabilities detected');
        }
      } catch (error) {
        this.log('major', 'Security Audit', 'Could not parse audit results', { error: error.message });
      }
    } else {
      this.log('major', 'Security Audit', 'NPM audit failed', { error: auditResult.error });
    }
  }

  async checkEnvironmentConfiguration() {
    console.log('\n=== Environment Configuration Check ===');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'DATABASE_URL',
      'DIRECT_URL'
    ];
    
    const optionalEnvVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'RESEND_API_KEY',
      'UPSTASH_REDIS_REST_URL'
    ];
    
    let missingRequired = [];
    let missingOptional = [];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingRequired.push(envVar);
      }
    }
    
    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        missingOptional.push(envVar);
      }
    }
    
    if (missingRequired.length > 0) {
      this.log('critical', 'Environment Variables', 'Required environment variables missing', {
        missing: missingRequired
      });
    } else {
      this.log('passed', 'Environment Variables', 'All required environment variables present');
    }
    
    if (missingOptional.length > 0) {
      this.log('minor', 'Optional Environment Variables', 'Some optional environment variables missing', {
        missing: missingOptional
      });
    }
  }

  async checkDatabaseSchema() {
    console.log('\n=== Database Schema Check ===');
    
    try {
      // Check if Prisma schema is valid
      const schemaResult = await this.runCommand('npx prisma validate', 'Prisma schema validation');
      
      if (!schemaResult.success) {
        this.log('critical', 'Database Schema', 'Prisma schema validation failed', {
          error: schemaResult.stderr
        });
        return false;
      }
      
      // Check for pending migrations
      const migrateResult = await this.runCommand('npx prisma migrate status', 'Migration status check');
      
      if (!migrateResult.success) {
        this.log('major', 'Database Migrations', 'Could not check migration status', {
          error: migrateResult.error
        });
      } else if (migrateResult.stdout.includes('Database schema is up to date')) {
        this.log('passed', 'Database Schema', 'Schema is valid and up to date');
      } else {
        this.log('major', 'Database Migrations', 'Pending migrations detected', {
          status: migrateResult.stdout
        });
      }
      
      return true;
    } catch (error) {
      this.log('critical', 'Database Schema', 'Database schema check failed', {
        error: error.message
      });
      return false;
    }
  }

  async checkCodeQuality() {
    console.log('\n=== Code Quality Check ===');
    
    // ESLint check
    const lintResult = await this.runCommand('npm run lint', 'ESLint code quality check');
    
    if (!lintResult.success) {
      this.log('major', 'Code Quality', 'ESLint found issues', {
        output: lintResult.stdout
      });
    } else {
      this.log('passed', 'Code Quality', 'ESLint checks passed');
    }
    
    // Check for TODO/FIXME comments
    const todoResult = await this.runCommand('grep -r "TODO\\|FIXME\\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . || true', 'TODO/FIXME comment scan');
    
    if (todoResult.stdout && todoResult.stdout.trim()) {
      const todoCount = todoResult.stdout.split('\n').length;
      this.log('minor', 'Code Comments', `${todoCount} TODO/FIXME comments found`, {
        comments: todoResult.stdout.split('\n').slice(0, 10) // First 10 for brevity
      });
    } else {
      this.log('passed', 'Code Comments', 'No TODO/FIXME comments found');
    }
  }

  async checkFileStructure() {
    console.log('\n=== File Structure Check ===');
    
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'tailwind.config.js',
      'tsconfig.json',
      'prisma/schema.prisma',
      'app/layout.tsx',
      'app/page.tsx'
    ];
    
    const requiredDirs = [
      'app',
      'components',
      'lib',
      'prisma'
    ];
    
    let missingFiles = [];
    let missingDirs = [];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(file);
      } catch {
        missingFiles.push(file);
      }
    }
    
    for (const dir of requiredDirs) {
      try {
        const stat = await fs.stat(dir);
        if (!stat.isDirectory()) {
          missingDirs.push(dir);
        }
      } catch {
        missingDirs.push(dir);
      }
    }
    
    if (missingFiles.length > 0 || missingDirs.length > 0) {
      this.log('critical', 'File Structure', 'Required files or directories missing', {
        missingFiles,
        missingDirs
      });
    } else {
      this.log('passed', 'File Structure', 'All required files and directories present');
    }
  }

  async checkBPMNIntegration() {
    console.log('\n=== BPMN.js Integration Check ===');
    
    try {
      // Check if BPMN files exist and are properly structured
      const bpmnFiles = [
        'lib/bpmn-designer.ts',
        'components/bpmn/bpmn-canvas.tsx',
        'components/bpmn/bpmn-studio.tsx'
      ];
      
      let missingBpmnFiles = [];
      for (const file of bpmnFiles) {
        try {
          await fs.access(file);
        } catch {
          missingBpmnFiles.push(file);
        }
      }
      
      if (missingBpmnFiles.length > 0) {
        this.log('critical', 'BPMN Integration', 'Core BPMN files missing', {
          missing: missingBpmnFiles
        });
        return false;
      }
      
      // Check for BPMN.js dependency
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      if (!packageJson.dependencies['bpmn-js']) {
        this.log('critical', 'BPMN Integration', 'bpmn-js dependency missing');
        return false;
      }
      
      this.log('passed', 'BPMN Integration', 'BPMN.js integration files present');
      return true;
    } catch (error) {
      this.log('critical', 'BPMN Integration', 'BPMN integration check failed', {
        error: error.message
      });
      return false;
    }
  }

  async checkPerformance() {
    console.log('\n=== Performance Check ===');
    
    try {
      // Check bundle size after build
      const nextDir = path.join(process.cwd(), '.next');
      try {
        await fs.access(nextDir);
        
        // Get build stats
        const buildStatsPath = path.join(nextDir, 'build-manifest.json');
        try {
          const buildStats = JSON.parse(await fs.readFile(buildStatsPath, 'utf8'));
          this.log('passed', 'Performance', 'Build manifest generated successfully');
        } catch {
          this.log('minor', 'Performance', 'Could not read build manifest');
        }
        
      } catch {
        this.log('major', 'Performance', 'Build output not found - run npm run build first');
      }
      
      // Check for performance optimization settings
      const nextConfigExists = await fs.access('next.config.js').then(() => true).catch(() => false);
      if (nextConfigExists) {
        this.log('passed', 'Performance', 'Next.js configuration file present');
      } else {
        this.log('minor', 'Performance', 'Next.js configuration file missing');
      }
      
    } catch (error) {
      this.log('major', 'Performance', 'Performance check failed', {
        error: error.message
      });
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('PRODUCTION READINESS AUDIT REPORT');
    console.log('='.repeat(80));
    console.log(`Audit completed in ${duration} seconds`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    console.log('\nSUMMARY:');
    console.log(`- Critical Issues: ${this.results.critical.length}`);
    console.log(`- Major Issues: ${this.results.major.length}`);
    console.log(`- Minor Issues: ${this.results.minor.length}`);
    console.log(`- Passed Checks: ${this.results.passed.length}`);
    
    if (this.results.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES (Must fix before production):');
      this.results.critical.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.title}: ${issue.message}`);
      });
    }
    
    if (this.results.major.length > 0) {
      console.log('\n⚠️  MAJOR ISSUES (Should fix before production):');
      this.results.major.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.title}: ${issue.message}`);
      });
    }
    
    if (this.results.minor.length > 0) {
      console.log('\n💡 MINOR ISSUES (Nice to fix):');
      this.results.minor.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.title}: ${issue.message}`);
      });
    }
    
    const isProductionReady = this.results.critical.length === 0 && this.results.major.length <= 2;
    
    console.log('\n' + '='.repeat(80));
    if (isProductionReady) {
      console.log('✅ PRODUCTION READY: Application is ready for production deployment');
    } else {
      console.log('❌ NOT PRODUCTION READY: Critical or major issues must be resolved');
    }
    console.log('='.repeat(80));
    
    // Write detailed report to file
    const reportPath = path.join(process.cwd(), 'production-readiness-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      summary: {
        critical: this.results.critical.length,
        major: this.results.major.length,
        minor: this.results.minor.length,
        passed: this.results.passed.length,
        isProductionReady,
        duration,
        timestamp: new Date().toISOString()
      },
      details: this.results
    }, null, 2));
    
    console.log(`\nDetailed report written to: ${reportPath}`);
    
    return isProductionReady;
  }

  async run() {
    console.log('Starting BPMN Studio Production Readiness Audit...\n');
    
    // Run all checks
    await this.checkFileStructure();
    await this.checkEnvironmentConfiguration();
    await this.checkTypeScriptCompilation();
    await this.checkDependencyVulnerabilities();
    await this.checkDatabaseSchema();
    await this.checkBPMNIntegration();
    await this.checkCodeQuality();
    await this.checkBuildProcess();
    await this.checkPerformance();
    
    // Generate final report
    return await this.generateReport();
  }
}

// Run the audit
const auditor = new ProductionReadinessAuditor();
auditor.run().then(isReady => {
  process.exit(isReady ? 0 : 1);
}).catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});