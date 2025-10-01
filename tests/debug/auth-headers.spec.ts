import { test, expect } from '@playwright/test';

test.describe('Debug Auth Headers', () => {
  test('should capture auth headers sent by frontend', async ({ page }) => {
    const requests: any[] = [];

    // Interceptar todas as requisições
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        const headers = request.headers();
        requests.push({
          url,
          method: request.method(),
          authorization: headers['authorization'] || 'NO AUTH HEADER',
          authHeaderRaw: headers['authorization']
        });
      }
    });

    // Login
    await page.goto('https://auzap-frontend-web.onrender.com/login');
    await page.fill('input[type="email"]', 'cafofopet@aizuap.ai.br04');
    await page.fill('input[type="password"]', 'CafofoPet@2024#Secure');
    await page.click('button[type="submit"]');

    // Aguardar login
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Log dos requests
    console.log('\n===== AUTH HEADERS CAPTURED =====');
    requests.forEach((req, idx) => {
      console.log(`\nRequest ${idx + 1}:`);
      console.log(`URL: ${req.url}`);
      console.log(`Method: ${req.method}`);
      console.log(`Auth Header: ${req.authorization}`);

      if (req.authHeaderRaw) {
        const token = req.authHeaderRaw.replace('Bearer ', '');
        const parts = token.split('.');
        console.log(`Token Parts: ${parts.length}`);
        console.log(`Token (first 50 chars): ${token.substring(0, 50)}...`);
      }
    });
    console.log('\n================================\n');

    // Verificar se há requisições com auth
    const authRequests = requests.filter(r => r.authHeaderRaw);
    expect(authRequests.length).toBeGreaterThan(0);
  });
});
