import { Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class LoginPage {
  private helpers: TestHelpers;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
  }

  // Selectors
  readonly selectors = {
    // Form fields
    emailInput: '#email',
    passwordInput: '#password',

    // Buttons
    submitButton: 'button[type="submit"]',
    signupLinkButton: 'text="Criar conta"',
    showPasswordButton: 'button[type="button"]',

    // UI elements
    pageTitle: 'text="Login"',
    loadingSpinner: '.animate-spin',

    // Validation
    emailError: '#email ~ .text-red-600',
    passwordError: '#password ~ .text-red-600',
    generalError: '[data-testid="error-message"]',
  };

  /**
   * Navigate to login page (root)
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.helpers.waitForNetworkIdle();
  }

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.helpers.fillField(this.selectors.emailInput, email);
    await this.helpers.fillField(this.selectors.passwordInput, password);
  }

  /**
   * Submit login form
   */
  async submitForm(): Promise<void> {
    await this.helpers.clickButton(this.selectors.submitButton, {
      waitForResponse: '/api/auth/login'
    });
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.goto();
    await this.fillLoginForm(email, password);
    await this.submitForm();
  }

  /**
   * Verify successful login
   */
  async verifySuccessfulLogin(): Promise<void> {
    await this.helpers.verifyURL('/');
    await expect(this.page.locator('[data-testid="dashboard"]')).toBeVisible();
    expect(await this.helpers.isAuthenticated()).toBeTruthy();
  }

  /**
   * Verify login error
   */
  async verifyLoginError(errorMessage: string): Promise<void> {
    await this.helpers.verifyToast(errorMessage, 'error');
  }

  /**
   * Click signup link
   */
  async clickSignupLink(): Promise<void> {
    await this.helpers.clickButton(this.selectors.signupLinkButton);
    await this.helpers.verifyURL('/signup');
  }

  /**
   * Verify loading state
   */
  async verifyLoadingState(isLoading = true): Promise<void> {
    await this.helpers.verifyLoadingState(this.selectors.submitButton, isLoading);
  }

  /**
   * Test form validations
   */
  async testFieldValidations(): Promise<void> {
    await this.goto();

    // Test empty form
    await this.submitForm();
    await this.helpers.verifyValidationError(this.selectors.emailInput, 'Email é obrigatório');
    await this.helpers.verifyValidationError(this.selectors.passwordInput, 'Senha é obrigatória');

    // Test invalid email
    await this.helpers.fillField(this.selectors.emailInput, 'invalid-email');
    await this.submitForm();
    await this.helpers.verifyValidationError(this.selectors.emailInput, 'Email inválido');
  }
}