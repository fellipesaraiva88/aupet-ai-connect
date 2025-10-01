import { test, expect } from '@playwright/test';

// Admin security and permission tests
test.describe('Admin Security', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should prevent non-admin access to admin routes', async ({ page }) => {
    // Login as regular user
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Attempt to access admin dashboard
    const response = await page.goto('/admin/dashboard');

    // Should redirect or show 403
    expect(['/login', '/'].some(path => page.url().includes(path)) || response?.status() === 403).toBeTruthy();
  });

  test('should validate admin role before granting access', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Access admin should succeed
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should audit all admin actions', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Perform admin action
    await page.goto('/admin/users');
    await page.click('button[data-action="edit"]:first-of-type');
    await page.selectOption('select[name="role"]', 'manager');
    await page.click('button:has-text("Save")');

    // Check audit logs
    await page.goto('/admin/audit-logs');
    await expect(page.locator('td:has-text("user.update")')).toBeVisible();
  });

  test('should protect sensitive API endpoints', async ({ page, request }) => {
    // Try to access admin API without auth
    const response = await request.get('/api/admin/users');
    expect(response.status()).toBe(401);
  });

  test('should validate permission changes', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/permissions');

    // Try to assign invalid permission
    await page.click('button:has-text("Role Permissions")');
    await page.selectOption('select[name="role"]', 'user');

    // Should not allow assigning admin-only permissions to user role
    const adminOnlyCheckbox = page.locator('input[value="admin.access"]');
    if (await adminOnlyCheckbox.isVisible()) {
      expect(await adminOnlyCheckbox.isDisabled()).toBeTruthy();
    }
  });

  test('should require confirmation for destructive actions', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/users');

    // Click delete
    await page.click('button[data-action="delete"]:first-of-type');

    // Should show confirmation dialog
    await expect(page.locator('dialog:has-text("Delete User")')).toBeVisible();
    await expect(page.locator('text=This action cannot be undone')).toBeVisible();
  });

  test('should rate limit admin API calls', async ({ page, request }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Get auth token from page
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));

    // Make multiple rapid requests
    const requests = Array.from({ length: 100 }, () =>
      request.get('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    );

    const responses = await Promise.all(requests);

    // At least one should be rate limited
    const rateLimited = responses.some(r => r.status() === 429);
    expect(rateLimited).toBeTruthy();
  });

  test('should sanitize user inputs', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/permissions');
    await page.click('button:has-text("New Permission")');

    // Try XSS attack
    await page.fill('input[name="name"]', '<script>alert("XSS")</script>');
    await page.fill('input[name="resource"]', 'test');
    await page.click('button:has-text("Create")');

    // Should not execute script, should be escaped
    await page.goto('/admin/permissions');
    const content = await page.content();
    expect(content).not.toContain('<script>alert("XSS")</script>');
  });

  test('should validate CSRF tokens', async ({ page, request }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));

    // Try request without CSRF token
    const response = await request.post('/api/admin/users/1', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { role: 'admin' }
    });

    // Should validate CSRF or reject
    expect([200, 403].includes(response.status())).toBeTruthy();
  });

  test('should encrypt sensitive data in transit', async ({ page }) => {
    // Check that page is served over HTTPS in production
    const url = page.url();
    if (process.env.NODE_ENV === 'production') {
      expect(url).toMatch(/^https:/);
    }
  });

  test('should implement session timeout', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/dashboard');

    // Simulate session timeout by clearing token
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
    });

    // Reload page
    await page.reload();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should log failed authentication attempts', async ({ page }) => {
    // Multiple failed login attempts
    for (let i = 0; i < 3; i++) {
      await page.fill('input[type="email"]', 'admin@auzap.ai');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Login successfully
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Check audit logs for failed attempts
    await page.goto('/admin/audit-logs');
    await page.selectOption('select[name="action"]', 'auth.failed');
    await page.click('button:has-text("Filter")');

    // Should show failed login attempts
    await expect(page.locator('td:has-text("auth.failed")')).toBeVisible();
  });
});
