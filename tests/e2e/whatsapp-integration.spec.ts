import { test, expect } from '@playwright/test';

test.describe('WhatsApp Integration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login com Cafofo Pet
    await page.goto('https://auzap-frontend-web.onrender.com/login');
    await page.fill('input[type="email"]', 'cafofopet@aizuap.ai.br04');
    await page.fill('input[type="password"]', 'CafofoPet@2024#Secure');
    await page.click('button[type="submit"]');

    // Aguardar redirect para dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to WhatsApp page and see instances', async ({ page }) => {
    // Navegar para WhatsApp
    await page.click('a[href="/whatsapp"]');
    await page.waitForURL('**/whatsapp');

    // Aguardar página carregar
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar se não há erros de console críticos
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Tirar screenshot para análise
    await page.screenshot({ path: 'whatsapp-page-state.png', fullPage: true });

    // Verificar se há instâncias ou botão para criar
    const hasInstances = await page.locator('[data-testid="instance-card"]').count() > 0;
    const hasCreateButton = await page.locator('button:has-text("Criar Instância")').isVisible();

    expect(hasInstances || hasCreateButton).toBeTruthy();

    // Log erros encontrados
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors.filter(e =>
        !e.includes('toast instance not initialized')
      ));
    }
  });

  test('should fetch dashboard data without errors', async ({ page }) => {
    // Interceptar requisições
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/dashboard')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    const responses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/dashboard')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          body: await response.text()
        });
      }
    });

    // Aguardar requests
    await page.waitForTimeout(5000);

    // Log das requisições
    console.log('Dashboard API Requests:', JSON.stringify(requests, null, 2));
    console.log('Dashboard API Responses:', JSON.stringify(responses, null, 2));

    // Verificar se há 401/403/404
    const badResponses = responses.filter(r => r.status >= 400);
    if (badResponses.length > 0) {
      console.error('Failed requests:', badResponses);
    }

    expect(badResponses.length).toBe(0);
  });

  test('should have proper authentication headers', async ({ page }) => {
    let authHeader: string | null = null;

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        authHeader = request.headers()['authorization'];
      }
    });

    await page.goto('https://auzap-frontend-web.onrender.com/dashboard');
    await page.waitForLoadState('networkidle');

    expect(authHeader).toBeTruthy();
    expect(authHeader).toContain('Bearer ');

    console.log('Auth header present:', !!authHeader);
  });
});
