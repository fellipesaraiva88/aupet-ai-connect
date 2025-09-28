import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Auzap E2E Test Suite...');

  // Create a shared browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend (port 8080)...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    console.log('✅ Frontend is ready');

    // Check backend health
    console.log('⏳ Checking backend health (port 3001)...');
    const response = await page.request.get('http://localhost:3001/health');
    if (response.ok()) {
      console.log('✅ Backend is ready');
    } else {
      console.log('⚠️ Backend health check failed, but continuing...');
    }

    // Setup test environment state if needed
    console.log('🔧 Setting up test environment...');

    // Clear any existing test data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;