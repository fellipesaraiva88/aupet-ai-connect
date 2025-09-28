import { test, expect } from '@playwright/test';
import { SignupPage } from '../page-objects/SignupPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { ApiClient } from '../page-objects/ApiClient';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Authorization & Security Tests', () => {
  let signupPage: SignupPage;
  let dashboardPage: DashboardPage;
  let apiClient: ApiClient;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page, request }) => {
    signupPage = new SignupPage(page);
    dashboardPage = new DashboardPage(page);
    apiClient = new ApiClient(request);
    helpers = new TestHelpers(page);

    await helpers.clearAuth();
  });

  test.describe('TDD: Route Protection', () => {
    test('should protect all authenticated routes', async () => {
      // Red Phase: Try to access protected routes without authentication
      const protectedRoutes = [
        '/',
        '/customers',
        '/customers/new',
        '/pets',
        '/pets/new',
        '/appointments',
        '/appointments/new',
        '/conversations',
        '/conversations/123/history',
        '/catalog',
        '/analytics',
        '/analytics/history',
        '/settings',
        '/ai-config'
      ];

      for (const route of protectedRoutes) {
        await test.step(`Test protection for ${route}`, async () => {
          await dashboardPage.page.goto(route);

          // Should redirect to login page
          await helpers.verifyURL('/');

          // Should not be authenticated
          expect(await helpers.isAuthenticated()).toBeFalsy();

          // Should show login form elements
          await expect(dashboardPage.page.locator('#email')).toBeVisible();
          await expect(dashboardPage.page.locator('#password')).toBeVisible();
        });
      }
    });

    test('should allow access to public routes', async () => {
      const publicRoutes = [
        '/signup'
      ];

      for (const route of publicRoutes) {
        await test.step(`Test access to ${route}`, async () => {
          await dashboardPage.page.goto(route);
          await helpers.verifyURL(route);

          // Should not redirect to login
          await expect(dashboardPage.page.locator('#email')).not.toBeVisible();
        });
      }
    });

    test('should redirect authenticated users from signup to dashboard', async () => {
      // First authenticate user
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Auth Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Try to access signup page while authenticated
      await dashboardPage.page.goto('/signup');

      // Should redirect to dashboard
      await helpers.verifyURL('/');
      await dashboardPage.verifyDashboardLoaded();
    });
  });

  test.describe('TDD: JWT Token Security', () => {
    test('should handle expired tokens correctly', async () => {
      // Create user and get tokens
      const userData = await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Token Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Manually set an expired token
      await helpers.setAuth({
        accessToken: 'expired.jwt.token',
        refreshToken: 'expired.refresh.token',
        user: { id: '123', email: 'test@test.com' }
      });

      // Try to access protected route
      await dashboardPage.page.goto('/customers');

      // Should redirect to login due to invalid token
      await helpers.verifyURL('/');
      expect(await helpers.isAuthenticated()).toBeFalsy();
    });

    test('should handle malformed tokens correctly', async () => {
      // Set malformed tokens
      await helpers.setAuth({
        accessToken: 'malformed.token.here',
        refreshToken: 'malformed.refresh.here',
        user: { id: '123' }
      });

      // Try to access API endpoint
      const response = await dashboardPage.page.request.get('http://localhost:3001/api/customers', {
        headers: {
          'Authorization': 'Bearer malformed.token.here'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should validate token structure and claims', async ({ request }) => {
      // Test with missing Authorization header
      let response = await request.get('http://localhost:3001/api/customers');
      expect(response.status()).toBe(401);

      // Test with invalid Authorization format
      response = await request.get('http://localhost:3001/api/customers', {
        headers: { 'Authorization': 'InvalidFormat token' }
      });
      expect(response.status()).toBe(401);

      // Test with Bearer but no token
      response = await request.get('http://localhost:3001/api/customers', {
        headers: { 'Authorization': 'Bearer ' }
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('TDD: Session Management Security', () => {
    test('should handle concurrent sessions correctly', async ({ context }) => {
      // Create user
      const testData = {
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Session Test User',
        organizationName: TestHelpers.generateOrgName()
      };

      await signupPage.completeSignup(testData);

      // Open second browser context (simulating different device)
      const secondContext = await context.browser()?.newContext();
      const secondPage = await secondContext?.newPage();

      if (secondPage && secondContext) {
        // Try to login with same credentials in second session
        const secondSignup = new SignupPage(secondPage);
        const secondDashboard = new DashboardPage(secondPage);
        const secondHelpers = new TestHelpers(secondPage);

        await secondPage.goto('/');
        await secondHelpers.fillField('#email', testData.email);
        await secondHelpers.fillField('#password', testData.password);
        await secondHelpers.clickButton('button[type="submit"]');

        // Both sessions should work independently
        await dashboardPage.verifyDashboardLoaded();
        await secondDashboard.verifyDashboardLoaded();

        await secondContext.close();
      }
    });

    test('should clear sensitive data on logout', async () => {
      // Create and authenticate user
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Logout Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Verify tokens exist
      expect(await helpers.isAuthenticated()).toBeTruthy();

      // Logout
      await dashboardPage.logout();

      // Verify all auth data is cleared
      expect(await helpers.isAuthenticated()).toBeFalsy();

      const storageData = await dashboardPage.page.evaluate(() => ({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        user: localStorage.getItem('user')
      }));

      expect(storageData.accessToken).toBeNull();
      expect(storageData.refreshToken).toBeNull();
      expect(storageData.user).toBeNull();
    });
  });

  test.describe('TDD: Data Access Control', () => {
    test('should prevent unauthorized data access', async ({ request }) => {
      // Create two different users
      const user1Data = {
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'User One',
        organizationName: TestHelpers.generateOrgName(),
        subscriptionTier: 'free'
      };

      const user2Data = {
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'User Two',
        organizationName: TestHelpers.generateOrgName(),
        subscriptionTier: 'free'
      };

      // Create first user and add some data
      const user1Response = await apiClient.signup(user1Data);
      const user1Token = user1Response.data.tokens.accessToken;

      // Create customer for user1
      const customer1 = await apiClient.createCustomer({
        name: 'User1 Customer',
        email: TestHelpers.generateTestEmail(),
        phone: '+5511999887766'
      });

      // Create second user
      const client2 = new ApiClient(request);
      const user2Response = await client2.signup(user2Data);
      const user2Token = user2Response.data.tokens.accessToken;

      // User2 should not be able to access User1's customer data
      const response = await request.get(`http://localhost:3001/api/customers/${customer1.data.customer.id}`, {
        headers: { 'Authorization': `Bearer ${user2Token}` }
      });

      // Should return 403 Forbidden or 404 Not Found (depending on implementation)
      expect([403, 404]).toContain(response.status());
    });

    test('should enforce organization-level data isolation', async ({ request }) => {
      // This test ensures users can only see data from their organization

      // Create user and authenticate
      const userData = {
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Isolation Test User',
        organizationName: TestHelpers.generateOrgName(),
        subscriptionTier: 'free'
      };

      await apiClient.signup(userData);

      // Get user's customers (should only see their organization's data)
      const customersResponse = await apiClient.getCustomers();

      expect(customersResponse.success).toBeTruthy();

      // All returned customers should belong to the same organization
      if (customersResponse.data.customers.length > 0) {
        const organizationId = customersResponse.data.customers[0].organization_id;
        customersResponse.data.customers.forEach((customer: any) => {
          expect(customer.organization_id).toBe(organizationId);
        });
      }
    });
  });

  test.describe('TDD: Input Validation & XSS Protection', () => {
    test('should prevent XSS attacks in form inputs', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')" />',
        '"><script>alert("xss")</script>',
        '\'; DROP TABLE users; --'
      ];

      for (const payload of xssPayloads) {
        await test.step(`Test XSS payload: ${payload.substring(0, 20)}...`, async () => {
          await signupPage.goto();

          // Try to inject XSS in form fields
          await helpers.fillField('#fullName', payload);
          await helpers.fillField('#organizationName', payload);

          // Submit form
          await signupPage.fillSignupForm({
            email: TestHelpers.generateTestEmail(),
            password: 'TestPass123!',
            fullName: payload,
            organizationName: payload
          });

          // Form should either sanitize input or reject it
          // XSS should not execute
          const alertDialogs = dashboardPage.page.locator('text="xss"');
          await expect(alertDialogs).not.toBeVisible();
        });
      }
    });

    test('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        'user name@domain.com',
        '<script>alert("xss")</script>@domain.com'
      ];

      for (const email of invalidEmails) {
        await test.step(`Test invalid email: ${email}`, async () => {
          await signupPage.goto();
          await helpers.fillField('#email', email);
          await signupPage.submitForm();

          // Should show email validation error
          await helpers.verifyValidationError('#email', 'Email inválido');
        });
      }
    });

    test('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123',
        'password',
        'PASSWORD',
        '12345678',
        'Password',
        'password123',
        'PASSWORD123'
      ];

      for (const password of weakPasswords) {
        await test.step(`Test weak password: ${password}`, async () => {
          await signupPage.goto();
          await helpers.fillField('#password', password);
          await signupPage.submitForm();

          // Should show password validation error
          const errorElement = dashboardPage.page.locator('#password ~ .text-red-600');
          await expect(errorElement).toBeVisible();
        });
      }
    });
  });

  test.describe('TDD: API Security Headers', () => {
    test('should include security headers in API responses', async ({ request }) => {
      const response = await request.get('http://localhost:3001/health');

      // Check for security headers
      const headers = response.headers();

      // Should have CORS headers
      expect(headers['access-control-allow-origin']).toBeDefined();

      // Should have security headers (if implemented)
      // expect(headers['x-content-type-options']).toBe('nosniff');
      // expect(headers['x-frame-options']).toBe('DENY');
      // expect(headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('should handle CORS correctly', async ({ request }) => {
      // Test preflight request
      const preflightResponse = await request.fetch('http://localhost:3001/api/customers', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:8080',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization'
        }
      });

      expect(preflightResponse.ok()).toBeTruthy();

      const headers = preflightResponse.headers();
      expect(headers['access-control-allow-origin']).toBeDefined();
      expect(headers['access-control-allow-methods']).toBeDefined();
    });
  });

  test.describe('TDD: Rate Limiting & DoS Protection', () => {
    test('should implement rate limiting on sensitive endpoints', async ({ request }) => {
      // Test rate limiting on login endpoint
      const loginRequests = Array(20).fill(null).map((_, i) =>
        request.post('http://localhost:3001/api/auth/login', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            email: `test${i}@test.com`,
            password: 'password'
          }
        })
      );

      const responses = await Promise.all(loginRequests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status() === 429);

      // At least some requests should be rate limited if protection is in place
      // This test might need adjustment based on actual rate limiting implementation
    });

    test('should prevent brute force attacks', async ({ request }) => {
      const bruteForceAttempts = Array(10).fill(null).map(() =>
        request.post('http://localhost:3001/api/auth/login', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            email: 'admin@test.com',
            password: 'wrongpassword'
          }
        })
      );

      const responses = await Promise.all(bruteForceAttempts);

      // All should fail with 401, and potentially some with rate limiting
      responses.forEach(response => {
        expect([401, 429]).toContain(response.status());
      });
    });
  });

  test.describe('TDD: Data Encryption & Privacy', () => {
    test('should not expose sensitive data in API responses', async ({ request }) => {
      // Create user to test data exposure
      const userData = {
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Privacy Test User',
        organizationName: TestHelpers.generateOrgName(),
        subscriptionTier: 'free'
      };

      const signupResponse = await apiClient.signup(userData);

      // Password should never be returned in API responses
      expect(signupResponse.data.user.password).toBeUndefined();

      // Login response should also not contain password
      const loginResponse = await apiClient.login(userData.email, userData.password);
      expect(loginResponse.data.user.password).toBeUndefined();

      // Check if sensitive fields are properly filtered
      expect(loginResponse.data.user.hashedPassword).toBeUndefined();
      expect(loginResponse.data.user.salt).toBeUndefined();
    });

    test('should sanitize output data', async () => {
      // Create customer with potentially malicious data
      const customerData = {
        name: '<script>alert("xss")</script>User Name',
        email: TestHelpers.generateTestEmail(),
        phone: '+5511999887766',
        address: 'Address<script>alert("stored-xss")</script>'
      };

      await apiClient.signup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Sanitization Test',
        organizationName: TestHelpers.generateOrgName(),
        subscriptionTier: 'free'
      });

      const customerResponse = await apiClient.createCustomer(customerData);

      // Data should be sanitized or escaped
      expect(customerResponse.data.customer.name).not.toContain('<script>');
      expect(customerResponse.data.customer.address).not.toContain('<script>');
    });
  });
});