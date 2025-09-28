import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Clean up any persistent test data
    // This could include database cleanup, cache clearing, etc.

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid failing the test suite
  }
}

export default globalTeardown;