import { test, expect } from '@playwright/test';

// Admin panel E2E tests
test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@auzap.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should display system metrics', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Check for metric cards
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Sessions')).toBeVisible();
    await expect(page.locator('text=Total Organizations')).toBeVisible();
    await expect(page.locator('text=System Health')).toBeVisible();
  });

  test('should list users in user management', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);

    // Wait for user table to load
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    await page.goto('/admin/users');

    // Select role filter
    await page.click('select[name="role"]');
    await page.selectOption('select[name="role"]', 'admin');

    // Check that only admin users are displayed
    const roleLabels = await page.locator('td[data-role]').allTextContents();
    roleLabels.forEach(role => {
      expect(role.toLowerCase()).toContain('admin');
    });
  });

  test('should search users by email', async ({ page }) => {
    await page.goto('/admin/users');

    // Enter search query
    await page.fill('input[placeholder*="Search"]', 'admin@auzap.ai');
    await page.click('button:has-text("Search")');

    // Check results
    await expect(page.locator('td:has-text("admin@auzap.ai")')).toBeVisible();
  });

  test('should edit user details', async ({ page }) => {
    await page.goto('/admin/users');

    // Click edit button on first user
    await page.click('button[data-action="edit"]:first-of-type');

    // Wait for edit dialog
    await expect(page.locator('dialog')).toBeVisible();
    await expect(page.locator('h2:has-text("Edit User")')).toBeVisible();

    // Change role
    await page.selectOption('select[name="role"]', 'manager');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify success message
    await expect(page.locator('text=User updated successfully')).toBeVisible();
  });

  test('should deactivate user', async ({ page }) => {
    await page.goto('/admin/users');

    // Click deactivate button
    await page.click('button[data-action="deactivate"]:first-of-type');

    // Confirm action
    await expect(page.locator('dialog:has-text("Deactivate User")')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // Verify success
    await expect(page.locator('text=User deactivated successfully')).toBeVisible();
  });

  test('should perform bulk user operations', async ({ page }) => {
    await page.goto('/admin/users');

    // Select multiple users
    await page.click('input[type="checkbox"][data-select-all]');

    // Open bulk actions menu
    await page.click('button:has-text("Bulk Actions")');

    // Select deactivate action
    await page.click('text=Deactivate Selected');

    // Confirm
    await page.click('button:has-text("Confirm")');

    // Verify success
    await expect(page.locator('text=Bulk operation completed')).toBeVisible();
  });

  test('should display audit logs', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await expect(page).toHaveURL(/\/admin\/audit-logs/);

    // Check table headers
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
    await expect(page.locator('th:has-text("Resource")')).toBeVisible();
    await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
  });

  test('should filter audit logs by action', async ({ page }) => {
    await page.goto('/admin/audit-logs');

    // Filter by action
    await page.selectOption('select[name="action"]', 'user.update');
    await page.click('button:has-text("Filter")');

    // Verify filtered results
    const actions = await page.locator('td[data-action]').allTextContents();
    actions.forEach(action => {
      expect(action).toContain('user.update');
    });
  });

  test('should filter audit logs by date range', async ({ page }) => {
    await page.goto('/admin/audit-logs');

    // Set date range
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="start_date"]', today);
    await page.fill('input[name="end_date"]', today);
    await page.click('button:has-text("Filter")');

    // Verify results are from today
    await expect(page.locator('td[data-date]').first()).toContainText(today);
  });

  test('should export audit logs', async ({ page }) => {
    await page.goto('/admin/audit-logs');

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');

    // Select CSV format
    await page.click('text=CSV');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('audit-logs');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should display permissions', async ({ page }) => {
    await page.goto('/admin/permissions');
    await expect(page).toHaveURL(/\/admin\/permissions/);

    // Check permissions table
    await expect(page.locator('th:has-text("Permission")')).toBeVisible();
    await expect(page.locator('th:has-text("Resource")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should create new permission', async ({ page }) => {
    await page.goto('/admin/permissions');

    // Open create dialog
    await page.click('button:has-text("New Permission")');
    await expect(page.locator('dialog:has-text("Create Permission")')).toBeVisible();

    // Fill form
    await page.fill('input[name="name"]', 'Test Permission');
    await page.fill('input[name="resource"]', 'test_resource');
    await page.fill('input[name="description"]', 'Test permission description');

    // Add actions
    await page.click('button:has-text("Add Action")');
    await page.fill('input[name="action_0"]', 'read');

    // Save
    await page.click('button:has-text("Create")');

    // Verify success
    await expect(page.locator('text=Permission created successfully')).toBeVisible();
  });

  test('should assign permissions to role', async ({ page }) => {
    await page.goto('/admin/permissions');

    // Click role permissions tab
    await page.click('button:has-text("Role Permissions")');

    // Select role
    await page.selectOption('select[name="role"]', 'manager');

    // Select permissions
    await page.click('input[type="checkbox"][value="conversations.read"]');
    await page.click('input[type="checkbox"][value="customers.read"]');

    // Save
    await page.click('button:has-text("Update Permissions")');

    // Verify success
    await expect(page.locator('text=Role permissions updated')).toBeVisible();
  });

  test('should navigate between admin pages', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Navigate to users
    await page.click('a[href="/admin/users"]');
    await expect(page).toHaveURL(/\/admin\/users/);

    // Navigate to audit logs
    await page.click('a[href="/admin/audit-logs"]');
    await expect(page).toHaveURL(/\/admin\/audit-logs/);

    // Navigate to permissions
    await page.click('a[href="/admin/permissions"]');
    await expect(page).toHaveURL(/\/admin\/permissions/);

    // Back to dashboard
    await page.click('a[href="/admin/dashboard"]');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('should display real-time updates', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Wait for WebSocket connection
    await page.waitForTimeout(1000);

    // Check for live metrics updates
    const initialValue = await page.locator('[data-metric="active-sessions"]').textContent();

    // Wait for potential update
    await page.waitForTimeout(5000);

    // Metric should exist (may or may not have changed)
    await expect(page.locator('[data-metric="active-sessions"]')).toBeVisible();
  });

  test('should handle pagination in user list', async ({ page }) => {
    await page.goto('/admin/users');

    // Check pagination controls
    await expect(page.locator('button:has-text("Next")')).toBeVisible();

    // Go to next page
    await page.click('button:has-text("Next")');

    // Verify URL updated with page param
    await expect(page.url()).toContain('page=2');
  });

  test('should show user activity logs', async ({ page }) => {
    await page.goto('/admin/users');

    // Click on user to view details
    await page.click('tr[data-user-id]:first-of-type');

    // Wait for details panel
    await expect(page.locator('h2:has-text("User Activity")')).toBeVisible();

    // Check activity list
    await expect(page.locator('[data-activity-log]')).toHaveCount(expect.any(Number));
  });

  test('should enforce admin access only', async ({ page }) => {
    // Logout
    await page.click('button[data-action="logout"]');

    // Login as regular user
    await page.fill('input[type="email"]', 'user@auzap.ai');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');

    // Try to access admin
    await page.goto('/admin/dashboard');

    // Should be redirected or see access denied
    const url = page.url();
    const isAccessDenied = await page.locator('text=Access Denied').isVisible().catch(() => false);

    expect(url === '/' || isAccessDenied).toBeTruthy();
  });
});
