#!/usr/bin/env node

/**
 * Test Runner for CI/CD Integration
 * Orchestrates test execution with proper setup and teardown
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestConfig {
  environment: 'development' | 'staging' | 'production';
  baseUrl?: string;
  apiUrl?: string;
  parallel?: boolean;
  workers?: number;
  headless?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit' | 'all';
  reporters?: string[];
  testMatch?: string[];
  timeout?: number;
  retries?: number;
}

interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

class TestRunner {
  private config: TestConfig;
  private startTime: number = 0;

  constructor(config: TestConfig) {
    this.config = config;
  }

  async run(): Promise<TestResults> {
    console.log('🚀 Starting Auzap Test Suite...');
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Base URL: ${this.config.baseUrl || 'http://localhost:8080'}`);
    console.log(`API URL: ${this.config.apiUrl || 'http://localhost:3001'}`);

    this.startTime = Date.now();

    try {
      // Setup phase
      await this.setupEnvironment();

      // Pre-test health checks
      await this.performHealthChecks();

      // Run tests
      const results = await this.executeTests();

      // Post-test cleanup
      await this.cleanup();

      // Generate reports
      await this.generateReports(results);

      return results;
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }

  private async setupEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');

    // Create required directories
    const dirs = ['test-results', 'test-results/screenshots', 'test-results/videos', 'test-results/traces'];
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    // Set environment variables for tests
    process.env.PLAYWRIGHT_BASE_URL = this.config.baseUrl || 'http://localhost:8080';
    process.env.PLAYWRIGHT_API_URL = this.config.apiUrl || 'http://localhost:3001';
    process.env.CI = 'true';

    if (this.config.environment === 'development') {
      // Start development servers if needed
      await this.startDevelopmentServers();
    }

    console.log('✅ Environment setup complete');
  }

  private async startDevelopmentServers(): Promise<void> {
    console.log('⏳ Starting development servers...');

    try {
      // Check if servers are already running
      const frontendHealthy = await this.checkUrl('http://localhost:8080');
      const backendHealthy = await this.checkUrl('http://localhost:3001/health');

      if (!frontendHealthy) {
        console.log('Starting frontend server...');
        // Start frontend in background
        execSync('cd frontend && npm run dev &', { stdio: 'pipe' });
        await this.waitForUrl('http://localhost:8080', 60000);
      }

      if (!backendHealthy) {
        console.log('Starting backend server...');
        // Start backend in background
        execSync('cd backend && npm run dev &', { stdio: 'pipe' });
        await this.waitForUrl('http://localhost:3001/health', 60000);
      }

      console.log('✅ Development servers are ready');
    } catch (error) {
      console.error('❌ Failed to start development servers:', error);
      throw error;
    }
  }

  private async checkUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async waitForUrl(url: string, timeout: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await this.checkUrl(url)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Timeout waiting for ${url}`);
  }

  private async performHealthChecks(): Promise<void> {
    console.log('🏥 Performing health checks...');

    const checks = [
      { name: 'Frontend', url: this.config.baseUrl || 'http://localhost:8080' },
      { name: 'Backend API', url: `${this.config.apiUrl || 'http://localhost:3001'}/health` }
    ];

    for (const check of checks) {
      try {
        const healthy = await this.checkUrl(check.url);
        if (healthy) {
          console.log(`✅ ${check.name} is healthy`);
        } else {
          throw new Error(`${check.name} health check failed`);
        }
      } catch (error) {
        console.error(`❌ ${check.name} health check failed:`, error);
        throw error;
      }
    }
  }

  private async executeTests(): Promise<TestResults> {
    console.log('🧪 Executing test suites...');

    const playwrightCommand = this.buildPlaywrightCommand();

    try {
      const output = execSync(playwrightCommand, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      console.log(output);

      // Parse test results from output
      return this.parseTestResults(output);
    } catch (error: any) {
      console.error('Test execution error:', error.stdout || error.message);

      // Even if tests fail, try to parse results
      if (error.stdout) {
        return this.parseTestResults(error.stdout);
      }

      throw error;
    }
  }

  private buildPlaywrightCommand(): string {
    const args = ['npx playwright test'];

    // Browser selection
    if (this.config.browser && this.config.browser !== 'all') {
      args.push(`--project=${this.config.browser}`);
    }

    // Headless mode
    if (this.config.headless !== false) {
      args.push('--headed=false');
    }

    // Parallel execution
    if (this.config.parallel !== false) {
      args.push(`--workers=${this.config.workers || 4}`);
    }

    // Test pattern matching
    if (this.config.testMatch && this.config.testMatch.length > 0) {
      args.push(this.config.testMatch.join(' '));
    }

    // Reporters
    if (this.config.reporters) {
      this.config.reporters.forEach(reporter => {
        args.push(`--reporter=${reporter}`);
      });
    } else {
      args.push('--reporter=html,json,junit');
    }

    // Retries
    if (this.config.retries !== undefined) {
      args.push(`--retries=${this.config.retries}`);
    }

    // Output directory
    args.push('--output-dir=test-results');

    return args.join(' ');
  }

  private parseTestResults(output: string): TestResults {
    // Parse Playwright test output to extract results
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);
    const durationMatch = output.match(/(\d+(?:\.\d+)?(?:ms|s|m))/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
    const total = passed + failed + skipped;

    let duration = 0;
    if (durationMatch) {
      const timeStr = durationMatch[1];
      if (timeStr.includes('ms')) {
        duration = parseInt(timeStr);
      } else if (timeStr.includes('s')) {
        duration = parseFloat(timeStr) * 1000;
      } else if (timeStr.includes('m')) {
        duration = parseFloat(timeStr) * 60 * 1000;
      }
    }

    return {
      passed,
      failed,
      skipped,
      total,
      duration: duration || (Date.now() - this.startTime)
    };
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');

    if (this.config.environment === 'development') {
      // Kill development servers if we started them
      try {
        execSync('pkill -f "npm run dev"', { stdio: 'ignore' });
      } catch {
        // Ignore if no processes to kill
      }
    }

    console.log('✅ Cleanup complete');
  }

  private async generateReports(results: TestResults): Promise<void> {
    console.log('📊 Generating test reports...');

    // Generate summary report
    const summary = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      results,
      config: this.config
    };

    writeFileSync(
      join('test-results', 'summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Generate coverage report if available
    if (existsSync('coverage')) {
      try {
        execSync('npx nyc report --reporter=html --report-dir=test-results/coverage', {
          stdio: 'pipe'
        });
      } catch (error) {
        console.warn('Could not generate coverage report:', error);
      }
    }

    // Print summary to console
    this.printSummary(results);

    console.log('✅ Reports generated');
  }

  private printSummary(results: TestResults): void {
    console.log('\n📋 Test Execution Summary');
    console.log('=' .repeat(50));
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`⏱️  Duration: ${Math.round(results.duration / 1000)}s`);

    if (results.coverage) {
      console.log('\n📊 Coverage Summary');
      console.log(`Lines: ${results.coverage.lines}%`);
      console.log(`Functions: ${results.coverage.functions}%`);
      console.log(`Branches: ${results.coverage.branches}%`);
      console.log(`Statements: ${results.coverage.statements}%`);
    }

    const successRate = Math.round((results.passed / results.total) * 100);
    console.log(`\n🎯 Success Rate: ${successRate}%`);

    if (results.failed > 0) {
      console.log('\n❌ Test execution completed with failures');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    environment: (process.env.NODE_ENV as any) || 'development',
    baseUrl: process.env.PLAYWRIGHT_BASE_URL,
    apiUrl: process.env.PLAYWRIGHT_API_URL,
    parallel: !args.includes('--no-parallel'),
    workers: parseInt(process.env.PLAYWRIGHT_WORKERS || '4'),
    headless: !args.includes('--headed'),
    browser: (args.find(arg => arg.startsWith('--browser='))?.split('=')[1] as any) || 'chromium',
    retries: parseInt(process.env.PLAYWRIGHT_RETRIES || '2'),
    testMatch: args.filter(arg => !arg.startsWith('--') && arg.endsWith('.spec.ts'))
  };

  const runner = new TestRunner(config);
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner, TestConfig, TestResults };