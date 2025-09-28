import { test, expect } from '@playwright/test';
import { SignupPage } from '../page-objects/SignupPage';
import { LoginPage } from '../page-objects/LoginPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Authentication Flow', () => {
  let signupPage: SignupPage;
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page);
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    helpers = new TestHelpers(page);

    // Clear authentication state before each test
    await helpers.clearAuth();
  });

  test.describe('TDD: Signup → Login → Dashboard Flow', () => {
    test('should complete full authentication flow successfully', async () => {
      // Red Phase: This test should initially fail until we implement proper signup
      const testData = {
        fullName: 'Test User E2E',
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        organizationName: TestHelpers.generateOrgName(),
        subscriptionTier: 'free' as const
      };

      // Step 1: Test Signup Flow
      await test.step('Complete signup process', async () => {
        const formData = await signupPage.completeSignup(testData);

        // Verify successful signup
        await signupPage.verifySuccessfulSignup();
        await helpers.verifyURL('/');

        // Verify user is authenticated after signup
        expect(await helpers.isAuthenticated()).toBeTruthy();

        // Store credentials for login test
        testData.email = formData.email;
        testData.password = formData.password;
      });

      // Step 2: Test Logout and Re-login
      await test.step('Logout and re-login', async () => {
        // Clear auth to simulate logout
        await helpers.clearAuth();
        await loginPage.goto();

        // Login with same credentials
        await loginPage.login(testData.email, testData.password);
        await loginPage.verifySuccessfulLogin();
      });

      // Step 3: Verify Dashboard Access
      await test.step('Verify dashboard functionality', async () => {
        await dashboardPage.verifyDashboardLoaded();
        await dashboardPage.verifyMetricsCards();
        await dashboardPage.verifyRecentConversations();
        await dashboardPage.verifyAIPerformance();
      });

      // Step 4: Test Navigation Flow
      await test.step('Test navigation to all sections', async () => {
        await dashboardPage.testAllNavigation();
      });
    });

    test('should handle signup validation errors correctly', async () => {
      // Red Phase: Test validation failures
      await test.step('Test form validation errors', async () => {
        await signupPage.testFieldValidations();
      });

      await test.step('Test password visibility toggle', async () => {
        await signupPage.goto();
        await signupPage.verifyPasswordVisibility(false);
        await signupPage.togglePasswordVisibility();
        await signupPage.verifyPasswordVisibility(true);
        await signupPage.togglePasswordVisibility();
        await signupPage.verifyPasswordVisibility(false);
      });
    });

    test('should handle login validation errors correctly', async () => {
      // Red Phase: Test login validation
      await test.step('Test login form validations', async () => {
        await loginPage.testFieldValidations();
      });

      await test.step('Test invalid credentials', async () => {
        await loginPage.login('invalid@email.com', 'InvalidPass123!');
        await loginPage.verifyLoginError('Credenciais inválidas');
      });
    });

    test('should redirect unauthenticated users to login', async () => {
      // Red Phase: Test protected route access
      await test.step('Try accessing protected routes without auth', async () => {
        const protectedRoutes = [
          '/customers',
          '/pets',
          '/appointments',
          '/conversations',
          '/analytics',
          '/settings'
        ];

        for (const route of protectedRoutes) {
          await dashboardPage.page.goto(route);
          await helpers.verifyURL('/'); // Should redirect to login
          expect(await helpers.isAuthenticated()).toBeFalsy();
        }
      });
    });

    test('should handle signup → navigation flow', async () => {
      await test.step('Navigate from signup to login', async () => {
        await signupPage.goto();
        await signupPage.clickLoginLink();
        await helpers.verifyURL('/');
      });

      await test.step('Navigate from login to signup', async () => {
        await loginPage.goto();
        await loginPage.clickSignupLink();
        await helpers.verifyURL('/signup');
      });
    });
  });

  test.describe('TDD: Responsive Authentication', () => {
    test('should work correctly on mobile devices', async () => {
      await test.step('Test mobile signup', async () => {
        await signupPage.testResponsive();
      });

      await test.step('Test mobile dashboard after signup', async () => {
        // First complete signup on mobile
        await helpers.checkResponsive('mobile');
        const formData = await signupPage.completeSignup({
          email: TestHelpers.generateTestEmail(),
          password: 'TestPass123!',
          fullName: 'Mobile User',
          organizationName: TestHelpers.generateOrgName()
        });

        // Test dashboard on mobile
        await dashboardPage.testResponsive();
      });
    });

    test('should maintain auth state across viewport changes', async () => {
      // Complete signup on desktop
      await helpers.checkResponsive('desktop');
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Responsive User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Switch to mobile and verify auth is maintained
      await helpers.checkResponsive('mobile');
      await dashboardPage.verifyDashboardLoaded();
      expect(await helpers.isAuthenticated()).toBeTruthy();

      // Switch to tablet and verify
      await helpers.checkResponsive('tablet');
      await dashboardPage.verifyDashboardLoaded();
      expect(await helpers.isAuthenticated()).toBeTruthy();
    });
  });

  test.describe('TDD: Session Management', () => {
    test('should handle session persistence correctly', async ({ context }) => {
      // Complete signup
      const formData = await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Session User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Verify session is stored
      expect(await helpers.isAuthenticated()).toBeTruthy();

      // Reload page and verify session persists
      await dashboardPage.page.reload();
      await dashboardPage.verifyDashboardLoaded();
      expect(await helpers.isAuthenticated()).toBeTruthy();

      // Open new tab and verify session is shared
      const newPage = await context.newPage();
      const newDashboard = new DashboardPage(newPage);
      await newDashboard.goto();
      await newDashboard.verifyDashboardLoaded();

      // Cleanup
      await newPage.close();
    });

    test('should handle logout correctly', async () => {
      // Complete signup
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Logout User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Verify authenticated
      expect(await helpers.isAuthenticated()).toBeTruthy();

      // Logout
      await dashboardPage.logout();

      // Verify logged out
      expect(await helpers.isAuthenticated()).toBeFalsy();
      await helpers.verifyURL('/');
    });
  });

  test.describe('TDD: Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      await test.step('Test signup with network interruption', async () => {
        await signupPage.goto();

        // Fill form
        await signupPage.fillSignupForm({
          email: TestHelpers.generateTestEmail(),
          password: 'TestPass123!',
          fullName: 'Network Test User',
          organizationName: TestHelpers.generateOrgName()
        });

        // Simulate network failure by going offline
        await dashboardPage.page.context().setOffline(true);

        // Try to submit - should handle error
        await signupPage.submitForm();

        // Should show appropriate error message
        await signupPage.verifySignupError('Erro de rede');

        // Restore network
        await dashboardPage.page.context().setOffline(false);
      });
    });

    test('should handle duplicate email registration', async () => {
      const testEmail = TestHelpers.generateTestEmail();

      // First signup should succeed
      await signupPage.completeSignup({
        email: testEmail,
        password: 'TestPass123!',
        fullName: 'First User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Clear auth and try same email again
      await helpers.clearAuth();

      await signupPage.goto();
      await signupPage.fillSignupForm({
        email: testEmail, // Same email
        password: 'TestPass123!',
        fullName: 'Second User',
        organizationName: TestHelpers.generateOrgName()
      });

      await signupPage.submitForm();
      await signupPage.verifySignupError('Email já está em uso');
    });
  });
});