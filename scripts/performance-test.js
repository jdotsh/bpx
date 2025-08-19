const { performance } = require('perf_hooks');

class PerformanceTester {
  constructor() {
    this.results = {
      bundleSize: {},
      loadingTimes: {},
      memoryUsage: {},
      renderTimes: {}
    };
  }

  async testBundleAnalysis() {
    console.log('📊 Analyzing bundle size...');
    
    try {
      const { execSync } = require('child_process');
      
      // Build for production to get real bundle sizes
      console.log('Building production bundle...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Check .next folder for bundle info
      const fs = require('fs');
      const path = require('path');
      
      const buildManifest = path.join('.next', 'build-manifest.json');
      if (fs.existsSync(buildManifest)) {
        const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
        console.log('📦 Bundle Analysis:');
        console.log('- Pages:', Object.keys(manifest.pages).length);
        console.log('- Static files:', Object.keys(manifest.pages).map(p => manifest.pages[p].length).reduce((a,b) => a+b, 0));
      }
      
      return true;
    } catch (error) {
      console.error('Bundle analysis failed:', error.message);
      return false;
    }
  }

  async testPageLoad() {
    console.log('🚀 Testing page load performance...');
    
    const puppeteer = require('puppeteer');
    let browser, page;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
      
      page = await browser.newPage();
      
      // Test homepage
      console.log('Testing homepage...');
      const homeStart = performance.now();
      await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
      const homeEnd = performance.now();
      
      this.results.loadingTimes.homepage = homeEnd - homeStart;
      
      // Test studio page
      console.log('Testing studio page...');
      const studioStart = performance.now();
      await page.goto('http://localhost:3001/studio', { waitUntil: 'networkidle0' });
      const studioEnd = performance.now();
      
      this.results.loadingTimes.studio = studioEnd - studioStart;
      
      // Get page metrics
      const metrics = await page.metrics();
      this.results.memoryUsage = {
        jsHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024),
        jsHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024),
      };
      
      console.log('✅ Page load tests completed');
      return true;
      
    } catch (error) {
      console.error('Page load test failed:', error.message);
      console.log('ℹ️  Make sure the dev server is running on port 3001');
      return false;
    } finally {
      if (browser) await browser.close();
    }
  }

  async testThemeSwitching() {
    console.log('🎨 Testing theme switching performance...');
    
    const puppeteer = require('puppeteer');
    let browser, page;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
      
      page = await browser.newPage();
      await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
      
      // Test theme switching speed
      const switchTimes = [];
      
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        
        await page.click('button[data-testid="theme-toggle"]');
        await page.waitForTimeout(100); // Wait for transition
        
        const end = performance.now();
        switchTimes.push(end - start);
      }
      
      this.results.renderTimes.themeSwitching = {
        average: switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length,
        min: Math.min(...switchTimes),
        max: Math.max(...switchTimes)
      };
      
      console.log('✅ Theme switching tests completed');
      return true;
      
    } catch (error) {
      console.error('Theme switching test failed:', error.message);
      return false;
    } finally {
      if (browser) await browser.close();
    }
  }

  async testBPMNPerformance() {
    console.log('🔧 Testing BPMN canvas performance...');
    
    const puppeteer = require('puppeteer');
    let browser, page;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
      
      page = await browser.newPage();
      
      const start = performance.now();
      await page.goto('http://localhost:3001/studio', { waitUntil: 'networkidle0' });
      
      // Wait for BPMN canvas to load
      await page.waitForSelector('.bpmn-canvas', { timeout: 10000 });
      await page.waitForSelector('.djs-container', { timeout: 10000 });
      
      const end = performance.now();
      
      this.results.loadingTimes.bpmnCanvas = end - start;
      
      // Test canvas interactions
      const canvas = await page.$('.djs-container');
      if (canvas) {
        const interactionStart = performance.now();
        
        // Simulate some interactions
        await canvas.click();
        await page.waitForTimeout(100);
        
        const interactionEnd = performance.now();
        this.results.renderTimes.canvasInteraction = interactionEnd - interactionStart;
      }
      
      console.log('✅ BPMN canvas tests completed');
      return true;
      
    } catch (error) {
      console.error('BPMN performance test failed:', error.message);
      return false;
    } finally {
      if (browser) await browser.close();
    }
  }

  generateReport() {
    console.log('\n📋 PERFORMANCE REPORT');
    console.log('=' .repeat(50));
    
    if (Object.keys(this.results.loadingTimes).length > 0) {
      console.log('\n⏱️  Loading Times:');
      Object.entries(this.results.loadingTimes).forEach(([key, value]) => {
        const score = value < 1000 ? '🟢' : value < 3000 ? '🟡' : '🔴';
        console.log(`   ${score} ${key}: ${Math.round(value)}ms`);
      });
    }
    
    if (Object.keys(this.results.memoryUsage).length > 0) {
      console.log('\n💾 Memory Usage:');
      Object.entries(this.results.memoryUsage).forEach(([key, value]) => {
        const score = value < 50 ? '🟢' : value < 100 ? '🟡' : '🔴';
        console.log(`   ${score} ${key}: ${value}MB`);
      });
    }
    
    if (Object.keys(this.results.renderTimes).length > 0) {
      console.log('\n🎨 Render Performance:');
      Object.entries(this.results.renderTimes).forEach(([key, value]) => {
        if (typeof value === 'object') {
          console.log(`   ${key}:`);
          Object.entries(value).forEach(([subKey, subValue]) => {
            const score = subValue < 100 ? '🟢' : subValue < 200 ? '🟡' : '🔴';
            console.log(`     ${score} ${subKey}: ${Math.round(subValue)}ms`);
          });
        } else {
          const score = value < 100 ? '🟢' : value < 200 ? '🟡' : '🔴';
          console.log(`   ${score} ${key}: ${Math.round(value)}ms`);
        }
      });
    }
    
    console.log('\n🎯 Performance Scores:');
    const avgLoadTime = Object.values(this.results.loadingTimes).reduce((a, b) => a + b, 0) / Object.values(this.results.loadingTimes).length || 0;
    const memoryEfficient = this.results.memoryUsage.jsHeapUsedSize < 50;
    const fastThemeSwitching = this.results.renderTimes.themeSwitching?.average < 100;
    
    console.log(`   ${avgLoadTime < 2000 ? '🟢' : '🟡'} Overall Load Speed: ${avgLoadTime < 2000 ? 'Excellent' : 'Good'}`);
    console.log(`   ${memoryEfficient ? '🟢' : '🟡'} Memory Efficiency: ${memoryEfficient ? 'Excellent' : 'Good'}`);
    console.log(`   ${fastThemeSwitching ? '🟢' : '🟡'} Theme Performance: ${fastThemeSwitching ? 'Excellent' : 'Good'}`);
    
    console.log('\n' + '='.repeat(50));
  }

  async runAllTests() {
    console.log('🔥 Starting comprehensive performance test...\n');
    
    const tests = [
      () => this.testPageLoad(),
      () => this.testThemeSwitching(),
      () => this.testBPMNPerformance(),
      () => this.testBundleAnalysis()
    ];
    
    for (const test of tests) {
      try {
        await test();
        console.log('');
      } catch (error) {
        console.error('Test failed:', error.message);
      }
    }
    
    this.generateReport();
  }
}

// Check if puppeteer is installed
try {
  require('puppeteer');
  
  const tester = new PerformanceTester();
  tester.runAllTests().catch(console.error);
  
} catch (error) {
  console.log('📦 Installing puppeteer for performance testing...');
  const { execSync } = require('child_process');
  
  try {
    execSync('npm install --save-dev puppeteer', { stdio: 'inherit' });
    console.log('✅ Puppeteer installed. Re-running tests...');
    
    const tester = new PerformanceTester();
    tester.runAllTests().catch(console.error);
    
  } catch (installError) {
    console.error('Failed to install puppeteer. Running basic tests only...');
    
    // Basic performance test without browser automation
    console.log('🔥 Running basic performance analysis...\n');
    
    const tester = new PerformanceTester();
    tester.testBundleAnalysis().then(() => {
      console.log('\n📋 BASIC PERFORMANCE REPORT');
      console.log('=' .repeat(50));
      console.log('✅ Bundle analysis completed');
      console.log('ℹ️  Install puppeteer for comprehensive testing');
      console.log('   npm install --save-dev puppeteer');
    });
  }
}