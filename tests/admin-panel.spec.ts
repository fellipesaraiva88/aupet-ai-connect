import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@auzap.ai';
const ADMIN_PASSWORD = 'admin123';
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8083';
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test.describe('Admin Dashboard', () => {
    test('should display admin dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Wait for dashboard to load
      await page.waitForSelector('h1:has-text("Admin Dashboard")');

      // Check for key metrics
      await expect(page.locator('text=Total Users')).toBeVisible();
      await expect(page.locator('text=Active Users')).toBeVisible();
      await expect(page.locator('text=Total Organizations')).toBeVisible();
    });

    test('should display system health metrics', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Check for health metrics
      await expect(page.locator('text=System Health')).toBeVisible();
      await expect(page.locator('text=API Status')).toBeVisible();
    });

    test('should display recent activity', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Check for recent activity section
      await expect(page.locator('text=Recent Activity')).toBeVisible();
    });
  });

  test.describe('User Management', () => {
    test('should display user list', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);

      // Wait for user list to load
      await page.waitForSelector('table');

      // Check for table headers
      await expect(page.locator('th:has-text("Email")')).toBeVisible();
      await expect(page.locator('th:has-text("Role")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
    });

    test('should filter users by role', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);

      // Wait for user list
      await page.waitForSelector('table');

      // Filter by admin role
      await page.click('button:has-text("Filter")');
      await page.click('text=Admin');

      // Verify filtered results
      await page.waitForTimeout(1000);
      const roleCell = page.locator('td:has-text("admin")').first();
      await expect(roleCell).toBeVisible();
    });

    test('should search users', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);

      // Wait for user list
      await page.waitForSelector('table');

      // Search for user
      await page.fill('input[placeholder*="Search"]', 'admin');
      await page.waitForTimeout(1000);

      // Verify search results
      const emailCell = page.locator('td:has-text("admin")').first();
      await expect(emailCell).toBeVisible();
    });

    test('should open user edit dialog', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);

      // Wait for user list
      await page.waitForSelector('table');

      // Click edit button on first user
      await page.click('button[aria-label="Edit user"]').first();

      // Verify dialog opened
      await expect(page.locator('text=Edit User')).toBeVisible();
    });

    test('should update user role', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);

      // Wait for user list
      await page.waitForSelector('table');

      // Click edit button
      await page.click('button[aria-label="Edit user"]').first();

      // Change role
      await page.click('select[name="role"]');
      await page.click('option:has-text("Manager")');

      // Save changes
      await page.click('button:has-text("Save")');

      // Verify success message
      await expect(page.locator('text=User updated successfully')).toBeVisible();
    });

    test('should perform bulk deactivation', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);

      // Wait for user list
      await page.waitForSelector('table');

      // Select multiple users
      await page.click('input[type="checkbox"]').first();
      await page.click('input[type="checkbox"]').nth(1);

      // Open bulk actions
      await page.click('button:has-text("Bulk Actions")');
      await page.click('text=Deactivate');

      // Confirm action
      await page.click('button:has-text("Confirm")');

      // Verify success
      await expect(page.locator('text=Users deactivated successfully')).toBeVisible();
    });
  });

  test.describe('Audit Logs', () => {
    test('should display audit logs', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/audit-logs`);

      // Wait for logs to load
      await page.waitForSelector('table');

      // Check for table headers
      await expect(page.locator('th:has-text("User")')).toBeVisible();
      await expect(page.locator('th:has-text("Action")')).toBeVisible();
      await expect(page.locator('th:has-text("Resource")')).toBeVisible();
      await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
    });

    test('should filter logs by action', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/audit-logs`);

      // Wait for logs
      await page.waitForSelector('table');

      // Filter by action
      await page.click('button:has-text("Filter")');
      await page.click('text=user.update');

      // Verify filtered results
      await page.waitForTimeout(1000);
      const actionCell = page.locator('td:has-text("user.update")').first();
      await expect(actionCell).toBeVisible();
    });

    test('should filter logs by date range', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/audit-logs`);

      // Wait for logs
      await page.waitForSelector('table');

      // Open date filter
      await page.click('button:has-text("Date Range")');

      // Select last 7 days
      await page.click('text=Last 7 days');

      // Verify filter applied
      await page.waitForTimeout(1000);
      await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 5000 });
    });

    test('should export audit logs', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/audit-logs`);

      // Wait for logs
      await page.waitForSelector('table');

      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export")');

      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('audit-logs');
    });

    test('should view log details', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/audit-logs`);

      // Wait for logs
      await page.waitForSelector('table');

      // Click on first log entry
      await page.click('tbody tr').first();

      // Verify details dialog opened
      await expect(page.locator('text=Audit Log Details')).toBeVisible();
      await expect(page.locator('text=User:')).toBeVisible();
      await expect(page.locator('text=Action:')).toBeVisible();
    });
  });

  test.describe('Permissions Management', () => {
    test('should display permissions list', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/permissions`);

      // Wait for permissions to load
      await page.waitForSelector('table');

      // Check for table headers
      await expect(page.locator('th:has-text("Permission")')).toBeVisible();
      await expect(page.locator('th:has-text("Resource")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    });

    test('should create new permission', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/permissions`);

      // Click create button
      await page.click('button:has-text("Create Permission")');

      // Fill form
      await page.fill('input[name="name"]', 'test.permission');
      await page.fill('input[name="resource"]', 'test_resource');
      await page.fill('textarea[name="description"]', 'Test permission');

      // Add actions
      await page.click('button:has-text("Add Action")');
      await page.fill('input[name="actions.0"]', 'create');

      // Save
      await page.click('button:has-text("Save")');

      // Verify success
      await expect(page.locator('text=Permission created successfully')).toBeVisible();
    });

    test('should assign permissions to role', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/permissions`);

      // Switch to role permissions tab
      await page.click('button:has-text("Role Permissions")');

      // Select role
      await page.click('select[name="role"]');
      await page.click('option:has-text("Manager")');

      // Select permissions
      await page.click('input[type="checkbox"]').first();

      // Save changes
      await page.click('button:has-text("Save Role Permissions")');

      // Verify success
      await expect(page.locator('text=Role permissions updated successfully')).toBeVisible();
    });

    test('should filter permissions by resource', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/permissions`);

      // Wait for permissions
      await page.waitForSelector('table');

      // Filter by resource
      await page.click('button:has-text("Filter")');
      await page.fill('input[placeholder*="resource"]', 'user');

      // Verify filtered results
      await page.waitForTimeout(1000);
      const resourceCell = page.locator('td:has-text("user")').first();
      await expect(resourceCell).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between admin pages', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Navigate to users
      await page.click('a[href="/admin/users"]');
      await expect(page).toHaveURL(`${BASE_URL}/admin/users`);

      // Navigate to audit logs
      await page.click('a[href="/admin/audit-logs"]');
      await expect(page).toHaveURL(`${BASE_URL}/admin/audit-logs`);

      // Navigate to permissions
      await page.click('a[href="/admin/permissions"]');
      await expect(page).toHaveURL(`${BASE_URL}/admin/permissions`);
    });

    test('should redirect /admin to /admin/dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin`);
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
    });
  });

  test.describe('Access Control', () => {
    test('should restrict access to non-admin users', async ({ page }) => {
      // Logout
      await page.goto(`${BASE_URL}/settings`);
      await page.click('button:has-text("Logout")');

      // Login as regular user
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'user@auzap.ai');
      await page.fill('input[type="password"]', 'user123');
      await page.click('button[type="submit"]');

      // Try to access admin panel
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Should be redirected or show error
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });
  });
});
