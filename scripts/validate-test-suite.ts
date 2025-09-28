#!/usr/bin/env tsx

/**
 * Auzap Test Suite Validation Script
 * Validates the complete test setup and runs a comprehensive test validation
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

class TestSuiteValidator {
  private results: ValidationResult[] = [];

  async validate(): Promise<void> {
    console.log('🧪 Auzap Test Suite Validation');
    console.log('=' .repeat(50));

    // Structure validation
    await this.validateProjectStructure();

    // Dependencies validation
    await this.validateDependencies();

    // Configuration validation
    await this.validateConfiguration();

    // Test file validation
    await this.validateTestFiles();

    // Environment validation
    await this.validateEnvironment();

    // Quick test execution
    await this.executeQuickTests();

    // Generate report
    this.generateReport();
  }

  private async validateProjectStructure(): Promise<void> {
    console.log('\n📁 Validating Project Structure...');

    const requiredPaths = [
      'playwright.config.ts',
      'tests/global-setup.ts',
      'tests/global-teardown.ts',
      'tests/utils/test-helpers.ts',
      'tests/page-objects/SignupPage.ts',
      'tests/page-objects/LoginPage.ts',
      'tests/page-objects/DashboardPage.ts',
      'tests/page-objects/ApiClient.ts',
      'tests/e2e/auth-flow.spec.ts',
      'tests/api/api-integration.spec.ts',
      'tests/security/authorization.spec.ts',
      'tests/ui/form-validation.spec.ts',
      'tests/responsive/responsive-design.spec.ts',
      'tests/ci/test-runner.ts',
      '.github/workflows/test.yml'
    ];

    for (const path of requiredPaths) {
      const exists = existsSync(path);
      this.results.push({
        passed: exists,
        message: `${exists ? '✅' : '❌'} ${path}`,
        details: exists ? undefined : `Missing required file: ${path}`
      });
    }
  }

  private async validateDependencies(): Promise<void> {
    console.log('\n📦 Validating Dependencies...');

    try {
      // Check package.json dependencies
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const devDeps = packageJson.devDependencies || {};

      const requiredDeps = [
        '@playwright/test',
        'playwright',
        'tsx',
        '@types/node'
      ];

      for (const dep of requiredDeps) {
        const hasDepSomewhere = devDeps[dep] ||
          (packageJson.dependencies && packageJson.dependencies[dep]);

        this.results.push({
          passed: !!hasDepSomewhere,
          message: `${hasDepSomewhere ? '✅' : '❌'} ${dep}`,
          details: hasDepSomewhere ? undefined : `Missing dependency: ${dep}`
        });
      }

      // Check if browsers are installed
      try {
        execSync('npx playwright --version', { stdio: 'pipe' });
        this.results.push({
          passed: true,
          message: '✅ Playwright CLI available'
        });
      } catch {
        this.results.push({
          passed: false,
          message: '❌ Playwright CLI not available',
          details: 'Run: npm run test:install'
        });
      }

    } catch (error) {
      this.results.push({
        passed: false,
        message: '❌ Package.json validation failed',
        details: String(error)
      });
    }
  }

  private async validateConfiguration(): Promise<void> {
    console.log('\n⚙️ Validating Configuration...');

    try {
      // Validate Playwright config
      const configExists = existsSync('playwright.config.ts');
      if (configExists) {
        const config = readFileSync('playwright.config.ts', 'utf8');

        const requiredConfigs = [
          'testDir',
          'webServer',
          'projects',
          'reporter',
          'globalSetup',
          'globalTeardown'
        ];

        for (const configKey of requiredConfigs) {
          const hasConfig = config.includes(configKey);
          this.results.push({
            passed: hasConfig,
            message: `${hasConfig ? '✅' : '❌'} Config: ${configKey}`,
            details: hasConfig ? undefined : `Missing config: ${configKey}`
          });
        }
      }

      // Validate CI/CD workflow
      const workflowExists = existsSync('.github/workflows/test.yml');
      this.results.push({
        passed: workflowExists,
        message: `${workflowExists ? '✅' : '❌'} GitHub Actions workflow`,
        details: workflowExists ? undefined : 'Missing CI/CD configuration'
      });

    } catch (error) {
      this.results.push({
        passed: false,
        message: '❌ Configuration validation failed',
        details: String(error)
      });
    }
  }

  private async validateTestFiles(): Promise<void> {
    console.log('\n🧪 Validating Test Files...');

    const testSuites = [
      {
        name: 'Authentication Flow',
        file: 'tests/e2e/auth-flow.spec.ts',
        expectedTests: ['should complete full authentication flow successfully']
      },
      {
        name: 'API Integration',
        file: 'tests/api/api-integration.spec.ts',
        expectedTests: ['should signup new user successfully', 'should create customer successfully']
      },
      {
        name: 'Security Tests',
        file: 'tests/security/authorization.spec.ts',
        expectedTests: ['should protect all authenticated routes']
      },
      {
        name: 'Form Validation',
        file: 'tests/ui/form-validation.spec.ts',
        expectedTests: ['should validate required fields in real-time']
      },
      {
        name: 'Responsive Design',
        file: 'tests/responsive/responsive-design.spec.ts',
        expectedTests: ['should render correctly on']
      }
    ];

    for (const suite of testSuites) {
      if (existsSync(suite.file)) {
        const content = readFileSync(suite.file, 'utf8');

        // Check for TDD patterns
        const hasTDDDescribe = content.includes('TDD:');
        const hasTestSteps = content.includes('test.step');
        const hasPageObjects = content.includes('Page');

        this.results.push({
          passed: hasTDDDescribe,
          message: `${hasTDDDescribe ? '✅' : '❌'} ${suite.name}: TDD patterns`,
          details: hasTDDDescribe ? undefined : 'Missing TDD describe blocks'
        });

        this.results.push({
          passed: hasTestSteps,
          message: `${hasTestSteps ? '✅' : '❌'} ${suite.name}: Test steps`,
          details: hasTestSteps ? undefined : 'Missing test.step organization'
        });

        this.results.push({
          passed: hasPageObjects,
          message: `${hasPageObjects ? '✅' : '❌'} ${suite.name}: Page Objects`,
          details: hasPageObjects ? undefined : 'Missing Page Object usage'
        });
      }
    }
  }

  private async validateEnvironment(): Promise<void> {
    console.log('\n🌍 Validating Environment...');

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1));
      const nodeOk = majorVersion >= 18;

      this.results.push({
        passed: nodeOk,
        message: `${nodeOk ? '✅' : '❌'} Node.js version: ${nodeVersion}`,
        details: nodeOk ? undefined : 'Node.js 18+ required'
      });

      // Check if ports are available
      const ports = [8080, 3001];
      for (const port of ports) {
        try {
          const response = await fetch(`http://localhost:${port}`);
          this.results.push({
            passed: true,
            message: `✅ Port ${port} accessible`,
          });
        } catch {
          this.results.push({
            passed: false,
            message: `❌ Port ${port} not accessible`,
            details: `Service not running on port ${port}`
          });
        }
      }

    } catch (error) {
      this.results.push({
        passed: false,
        message: '❌ Environment validation failed',
        details: String(error)
      });
    }
  }

  private async executeQuickTests(): Promise<void> {
    console.log('\n⚡ Executing Quick Test Validation...');

    try {
      // Test Playwright installation
      const playwrightTest = execSync('npx playwright --version', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      this.results.push({
        passed: true,
        message: `✅ Playwright ready: ${playwrightTest.trim()}`
      });

      // Dry run of test configuration
      try {
        execSync('npx playwright test --list', {
          stdio: 'pipe',
          timeout: 30000
        });

        this.results.push({
          passed: true,
          message: '✅ Test configuration valid'
        });
      } catch (error) {
        this.results.push({
          passed: false,
          message: '❌ Test configuration invalid',
          details: 'Run: npx playwright test --list'
        });
      }

    } catch (error) {
      this.results.push({
        passed: false,
        message: '❌ Quick test execution failed',
        details: String(error)
      });
    }
  }

  private generateReport(): void {
    console.log('\n📊 Validation Report');
    console.log('=' .repeat(50));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\n📈 Summary:`);
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`🎯 Success Rate: ${Math.round((passed / total) * 100)}%`);

    // Show all results
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      console.log(`  ${result.message}`);
      if (result.details) {
        console.log(`    💡 ${result.details}`);
      }
    });

    // Recommendations
    if (failed > 0) {
      console.log('\n🔧 Recommendations:');

      const missingFiles = this.results
        .filter(r => !r.passed && r.message.includes('❌'))
        .map(r => r.details)
        .filter(Boolean);

      if (missingFiles.length > 0) {
        console.log('  📁 Fix missing files and dependencies:');
        console.log('     npm install');
        console.log('     npm run test:install');
      }

      const configIssues = this.results
        .filter(r => !r.passed && r.message.includes('Config'));

      if (configIssues.length > 0) {
        console.log('  ⚙️ Review configuration files');
      }

      const serviceIssues = this.results
        .filter(r => !r.passed && r.message.includes('Port'));

      if (serviceIssues.length > 0) {
        console.log('  🚀 Start required services:');
        console.log('     npm run dev');
      }
    } else {
      console.log('\n🎉 All validations passed! Test suite is ready.');
      console.log('\n🚀 Next steps:');
      console.log('  npm test                    # Run all tests');
      console.log('  npm run test:auth          # Run authentication tests');
      console.log('  npm run test:api           # Run API tests');
      console.log('  npm run test:report        # View test reports');
    }

    console.log('\n📚 Documentation: tests/README.md');
    console.log('🔗 GitHub Actions: .github/workflows/test.yml');
  }
}

// Execute validation
const validator = new TestSuiteValidator();
validator.validate().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});