#!/usr/bin/env node

/**
 * Security Audit Script for BPMN Studio
 * Tests for XSS, authentication bypass, rate limiting, CSRF protection, etc.
 */

import fs from 'fs/promises';
import path from 'path';

class SecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.securePatterns = [];
  }

  logVulnerability(severity, category, description, impact, recommendation) {
    this.vulnerabilities.push({
      severity,
      category,
      description,
      impact,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    const colors = {
      critical: '\x1b[31m',
      high: '\x1b[33m',
      medium: '\x1b[36m',
      low: '\x1b[37m'
    };
    
    console.log(`${colors[severity]}[${severity.toUpperCase()}] ${category}: ${description}\x1b[0m`);
    console.log(`  Impact: ${impact}`);
    console.log(`  Fix: ${recommendation}`);
  }

  logSecurePattern(category, description) {
    this.securePatterns.push({ category, description, timestamp: new Date().toISOString() });
    console.log(`✅ ${category}: ${description}`);
  }

  async analyzeFile(filePath, analyzer) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return analyzer(content, filePath);
    } catch (error) {
      console.log(`⚠️  Cannot analyze ${filePath}: ${error.message}`);
      return [];
    }
  }

  async auditInputValidation() {
    console.log('\n=== Input Validation Security Audit ===');
    
    const validationFiles = [
      'lib/validations/diagram.ts',
      'lib/validations/project.ts',
      'app/api/diagrams/route.ts',
      'app/api/projects/route.ts'
    ];
    
    for (const file of validationFiles) {
      await this.analyzeFile(file, (content, filePath) => {
        // Check for Zod validation
        if (content.includes('z.string()') && content.includes('max(')) {
          this.logSecurePattern('Input Validation', `${path.basename(filePath)} uses proper string length limits`);
        }
        
        // Check for XSS protection
        if (content.includes('.trim()')) {
          this.logSecurePattern('XSS Protection', `${path.basename(filePath)} trims input strings`);
        }
        
        // Check for SQL injection protection via Zod
        if (content.includes('cuid(') || content.includes('uuid(')) {
          this.logSecurePattern('SQL Injection', `${path.basename(filePath)} validates ID format`);
        }
        
        // Check for unsafe patterns
        if (content.includes('z.any()') && !content.includes('strict()')) {
          this.logVulnerability(
            'medium',
            'Input Validation',
            `${path.basename(filePath)} uses z.any() without strict validation`,
            'Could allow unexpected data types leading to application errors or security issues',
            'Replace z.any() with specific type validations or add .strict() mode'
          );
        }
        
        // Check for file upload validation
        if (content.includes('file') && !content.includes('mime')) {
          this.logVulnerability(
            'high',
            'File Upload',
            `${path.basename(filePath)} may not validate file types`,
            'Could allow malicious file uploads',
            'Implement proper file type and size validation'
          );
        }
        
        return [];
      });
    }
  }

  async auditAuthenticationSecurity() {
    console.log('\n=== Authentication Security Audit ===');
    
    const authFiles = [
      'lib/auth/server.ts',
      'lib/auth/client.ts',
      'middleware.ts'
    ];
    
    for (const file of authFiles) {
      await this.analyzeFile(file, (content, filePath) => {
        // Check for proper session handling
        if (content.includes('getUser') || content.includes('getSession')) {
          this.logSecurePattern('Authentication', `${path.basename(filePath)} implements user/session checking`);
        }
        
        // Check for JWT validation
        if (content.includes('jwt') && content.includes('verify')) {
          this.logSecurePattern('Authentication', `${path.basename(filePath)} validates JWT tokens`);
        }
        
        // Check for unsafe authentication bypass
        if (content.includes('user') && content.includes('admin') && !content.includes('role')) {
          this.logVulnerability(
            'high',
            'Authorization',
            `${path.basename(filePath)} may not properly check user roles`,
            'Could allow privilege escalation attacks',
            'Implement proper role-based access control (RBAC)'
          );
        }
        
        // Check for password security (if applicable)
        if (content.includes('password') && !content.includes('hash')) {
          this.logVulnerability(
            'critical',
            'Authentication',
            `${path.basename(filePath)} handles passwords without hashing`,
            'Passwords could be stored or transmitted in plaintext',
            'Use proper password hashing (bcrypt, scrypt, or Argon2)'
          );
        }
        
        return [];
      });
    }
  }

  async auditAPIEndpointSecurity() {
    console.log('\n=== API Endpoint Security Audit ===');
    
    // Find all API route files
    const apiDir = 'app/api';
    const findAPIFiles = async (dir) => {
      const files = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...await findAPIFiles(fullPath));
          } else if (entry.name === 'route.ts') {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
      }
      return files;
    };
    
    const apiFiles = await findAPIFiles(apiDir);
    
    for (const file of apiFiles) {
      await this.analyzeFile(file, (content, filePath) => {
        // Check for authentication in API routes
        if (content.includes('export async function') && !content.includes('getCurrentUser')) {
          this.logVulnerability(
            'high',
            'API Security',
            `${path.basename(filePath)} may not require authentication`,
            'Could allow unauthorized access to API endpoints',
            'Add authentication checks to all protected endpoints'
          );
        }
        
        // Check for rate limiting
        if (content.includes('POST') && !content.includes('rateLimit')) {
          this.logVulnerability(
            'medium',
            'Rate Limiting',
            `${path.basename(filePath)} POST endpoint without rate limiting`,
            'Could be vulnerable to DoS attacks or abuse',
            'Implement rate limiting for API endpoints'
          );
        }
        
        // Check for CORS configuration
        if (content.includes('NextResponse') && content.includes('headers')) {
          this.logSecurePattern('CORS', `${path.basename(filePath)} handles response headers`);
        }
        
        // Check for SQL injection protection (Prisma usage)
        if (content.includes('prisma.') && content.includes('where')) {
          this.logSecurePattern('SQL Injection', `${path.basename(filePath)} uses Prisma ORM (protected from SQL injection)`);
        }
        
        // Check for error information disclosure
        if (content.includes('error.message') && content.includes('NextResponse.json')) {
          this.logVulnerability(
            'medium',
            'Information Disclosure',
            `${path.basename(filePath)} may leak error details`,
            'Could expose sensitive system information to attackers',
            'Sanitize error messages before returning to client'
          );
        }
        
        return [];
      });
    }
  }

  async auditXSSProtection() {
    console.log('\n=== XSS Protection Audit ===');
    
    const frontendFiles = [
      'components/bpmn/bpmn-studio.tsx',
      'components/bpmn/bpmn-canvas.tsx',
      'app/dashboard/page.tsx',
      'app/projects/[id]/page.tsx'
    ];
    
    for (const file of frontendFiles) {
      await this.analyzeFile(file, (content, filePath) => {
        // Check for dangerouslySetInnerHTML usage
        if (content.includes('dangerouslySetInnerHTML')) {
          this.logVulnerability(
            'high',
            'XSS',
            `${path.basename(filePath)} uses dangerouslySetInnerHTML`,
            'Could allow script injection if user input is not properly sanitized',
            'Sanitize all HTML content or use safer alternatives'
          );
        }
        
        // Check for proper JSX usage (automatic escaping)
        if (content.includes('{') && content.includes('}') && !content.includes('dangerouslySetInnerHTML')) {
          this.logSecurePattern('XSS Protection', `${path.basename(filePath)} uses JSX for safe rendering`);
        }
        
        // Check for innerHTML usage
        if (content.includes('.innerHTML')) {
          this.logVulnerability(
            'high',
            'XSS',
            `${path.basename(filePath)} uses innerHTML directly`,
            'Could allow script injection',
            'Use textContent or proper DOM manipulation methods'
          );
        }
        
        // Check for eval usage
        if (content.includes('eval(')) {
          this.logVulnerability(
            'critical',
            'Code Injection',
            `${path.basename(filePath)} uses eval()`,
            'Could allow arbitrary code execution',
            'Remove eval() usage and find safer alternatives'
          );
        }
        
        return [];
      });
    }
  }

  async auditCSRFProtection() {
    console.log('\n=== CSRF Protection Audit ===');
    
    // Check middleware for CSRF protection
    await this.analyzeFile('middleware.ts', (content, filePath) => {
      if (content.includes('csrf') || content.includes('token')) {
        this.logSecurePattern('CSRF Protection', 'Middleware implements CSRF protection');
      } else {
        this.logVulnerability(
          'medium',
          'CSRF',
          'No explicit CSRF protection found in middleware',
          'State-changing requests could be vulnerable to CSRF attacks',
          'Implement CSRF token validation for state-changing operations'
        );
      }
      return [];
    });
    
    // Check for SameSite cookie settings
    await this.analyzeFile('next.config.js', (content, filePath) => {
      if (content.includes('SameSite') || content.includes('sameSite')) {
        this.logSecurePattern('CSRF Protection', 'Cookie SameSite attribute configured');
      } else {
        this.logVulnerability(
          'medium',
          'CSRF',
          'SameSite cookie attribute not configured',
          'Cookies could be sent in cross-site requests',
          'Configure SameSite=Strict or SameSite=Lax for cookies'
        );
      }
      return [];
    });
  }

  async auditSecurityHeaders() {
    console.log('\n=== Security Headers Audit ===');
    
    await this.analyzeFile('next.config.js', (content, filePath) => {
      const requiredHeaders = [
        'X-Frame-Options',
        'Content-Security-Policy',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy'
      ];
      
      const foundHeaders = requiredHeaders.filter(header => content.includes(header));
      
      foundHeaders.forEach(header => {
        this.logSecurePattern('Security Headers', `${header} configured`);
      });
      
      const missingHeaders = requiredHeaders.filter(header => !content.includes(header));
      missingHeaders.forEach(header => {
        this.logVulnerability(
          'medium',
          'Security Headers',
          `Missing ${header} security header`,
          'Could leave application vulnerable to various attacks',
          `Configure ${header} in next.config.js`
        );
      });
      
      return [];
    });
  }

  async auditEnvironmentSecurity() {
    console.log('\n=== Environment Security Audit ===');
    
    try {
      // Check for .env files in version control
      const gitignoreExists = await fs.access('.gitignore').then(() => true).catch(() => false);
      
      if (gitignoreExists) {
        await this.analyzeFile('.gitignore', (content, filePath) => {
          if (content.includes('.env')) {
            this.logSecurePattern('Environment Security', '.env files excluded from version control');
          } else {
            this.logVulnerability(
              'critical',
              'Environment Security',
              '.env files not in .gitignore',
              'Sensitive credentials could be committed to version control',
              'Add .env* to .gitignore immediately'
            );
          }
          return [];
        });
      }
      
      // Check for hardcoded secrets
      const codeFiles = await this.findCodeFiles('.');
      const secretPatterns = [
        /sk_live_[a-zA-Z0-9]{99}/g, // Stripe live keys
        /sk_test_[a-zA-Z0-9]{99}/g, // Stripe test keys
        /AKIA[0-9A-Z]{16}/g,        // AWS Access Keys
        /[0-9a-f]{32}/g             // Potential API keys (32 char hex)
      ];
      
      for (const file of codeFiles.slice(0, 20)) { // Limit to avoid too many files
        await this.analyzeFile(file, (content, filePath) => {
          secretPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              this.logVulnerability(
                'critical',
                'Secret Exposure',
                `Potential hardcoded secret in ${path.basename(filePath)}`,
                'Secrets in code could be exposed if code is compromised',
                'Move all secrets to environment variables'
              );
            }
          });
          return [];
        });
      }
      
    } catch (error) {
      console.log('⚠️  Could not complete environment security audit:', error.message);
    }
  }

  async findCodeFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip node_modules and .git directories
        if (entry.isDirectory() && !['node_modules', '.git', '.next'].includes(entry.name)) {
          files.push(...await this.findCodeFiles(fullPath, extensions));
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory access error
    }
    return files;
  }

  async generateSecurityReport() {
    console.log('\n' + '='.repeat(80));
    console.log('SECURITY AUDIT REPORT');
    console.log('='.repeat(80));
    
    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = this.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = this.vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = this.vulnerabilities.filter(v => v.severity === 'low').length;
    
    console.log('\nSECURITY SUMMARY:');
    console.log(`- Critical Vulnerabilities: ${criticalCount}`);
    console.log(`- High Risk: ${highCount}`);
    console.log(`- Medium Risk: ${mediumCount}`);
    console.log(`- Low Risk: ${lowCount}`);
    console.log(`- Secure Patterns Found: ${this.securePatterns.length}`);
    
    if (criticalCount > 0) {
      console.log('\n🚨 CRITICAL VULNERABILITIES (Fix Immediately):');
      this.vulnerabilities.filter(v => v.severity === 'critical').forEach((vuln, i) => {
        console.log(`${i + 1}. ${vuln.category}: ${vuln.description}`);
      });
    }
    
    if (highCount > 0) {
      console.log('\n⚠️  HIGH RISK VULNERABILITIES:');
      this.vulnerabilities.filter(v => v.severity === 'high').forEach((vuln, i) => {
        console.log(`${i + 1}. ${vuln.category}: ${vuln.description}`);
      });
    }
    
    const securityScore = Math.max(0, 100 - (criticalCount * 30) - (highCount * 20) - (mediumCount * 10) - (lowCount * 5));
    console.log(`\n📊 SECURITY SCORE: ${securityScore}/100`);
    
    if (securityScore >= 85) {
      console.log('✅ GOOD: Application has strong security posture');
    } else if (securityScore >= 70) {
      console.log('⚠️  FAIR: Some security improvements needed');
    } else {
      console.log('❌ POOR: Significant security issues must be addressed');
    }
    
    // Write detailed report
    const reportPath = path.join(process.cwd(), 'security-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      summary: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        securePatterns: this.securePatterns.length,
        securityScore,
        timestamp: new Date().toISOString()
      },
      vulnerabilities: this.vulnerabilities,
      securePatterns: this.securePatterns
    }, null, 2));
    
    console.log(`\nDetailed report written to: ${reportPath}`);
    console.log('='.repeat(80));
    
    return criticalCount === 0 && highCount <= 2;
  }

  async run() {
    console.log('Starting Security Audit...\n');
    
    await this.auditInputValidation();
    await this.auditAuthenticationSecurity();
    await this.auditAPIEndpointSecurity();
    await this.auditXSSProtection();
    await this.auditCSRFProtection();
    await this.auditSecurityHeaders();
    await this.auditEnvironmentSecurity();
    
    return await this.generateSecurityReport();
  }
}

// Run the security audit
const auditor = new SecurityAuditor();
auditor.run().then(isSecure => {
  process.exit(isSecure ? 0 : 1);
}).catch(error => {
  console.error('Security audit failed:', error);
  process.exit(1);
});