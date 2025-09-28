import { Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class SignupPage {
  private helpers: TestHelpers;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
  }

  // Selectors
  readonly selectors = {
    // Form fields
    fullNameInput: '#fullName',
    emailInput: '#email',
    passwordInput: '#password',
    organizationNameInput: '#organizationName',
    subscriptionSelect: '[data-testid="subscription-select"]',

    // Buttons
    submitButton: 'button[type="submit"]',
    showPasswordButton: 'button[type="button"]',
    loginLinkButton: 'text="Fazer login"',

    // UI elements
    pageTitle: 'text="Criar Conta"',
    loadingSpinner: '.animate-spin',
    passwordToggle: '[aria-label="Toggle password visibility"]',

    // Validation
    emailError: '#email ~ .text-red-600',
    passwordError: '#password ~ .text-red-600',
    fullNameError: '#fullName ~ .text-red-600',
    organizationError: '#organizationName ~ .text-red-600',
  };

  /**
   * Navigate to signup page
   */
  async goto(): Promise<void> {
    await this.page.goto('/signup');
    await this.helpers.waitForElement(this.selectors.pageTitle);
    await expect(this.page.locator(this.selectors.pageTitle)).toBeVisible();
  }

  /**
   * Fill signup form with valid data
   */
  async fillSignupForm(data?: {
    fullName?: string;
    email?: string;
    password?: string;
    organizationName?: string;
    subscriptionTier?: 'free' | 'pro' | 'enterprise';
  }): Promise<{
    fullName: string;
    email: string;
    password: string;
    organizationName: string;
    subscriptionTier: string;
  }> {
    const formData = {
      fullName: data?.fullName || 'Test User',
      email: data?.email || TestHelpers.generateTestEmail(),
      password: data?.password || 'TestPass123!',
      organizationName: data?.organizationName || TestHelpers.generateOrgName(),
      subscriptionTier: data?.subscriptionTier || 'free'
    };

    await this.helpers.fillField(this.selectors.fullNameInput, formData.fullName);
    await this.helpers.fillField(this.selectors.emailInput, formData.email);
    await this.helpers.fillField(this.selectors.passwordInput, formData.password);
    await this.helpers.fillField(this.selectors.organizationNameInput, formData.organizationName);

    // Select subscription tier
    await this.helpers.selectOption(this.selectors.subscriptionSelect, formData.subscriptionTier);

    return formData;
  }

  /**
   * Submit signup form
   */
  async submitForm(): Promise<void> {
    await this.helpers.clickButton(this.selectors.submitButton, {
      waitForResponse: '/api/auth/signup'
    });
  }

  /**
   * Complete signup flow
   */
  async completeSignup(data?: {
    fullName?: string;
    email?: string;
    password?: string;
    organizationName?: string;
    subscriptionTier?: 'free' | 'pro' | 'enterprise';
  }): Promise<{
    fullName: string;
    email: string;
    password: string;
    organizationName: string;
    subscriptionTier: string;
  }> {
    await this.goto();
    const formData = await this.fillSignupForm(data);
    await this.submitForm();
    return formData;
  }

  /**
   * Verify validation errors
   */
  async verifyValidationErrors(expectedErrors: {
    email?: string;
    password?: string;
    fullName?: string;
    organizationName?: string;
  }): Promise<void> {
    if (expectedErrors.email) {
      await this.helpers.verifyValidationError(this.selectors.emailInput, expectedErrors.email);
    }
    if (expectedErrors.password) {
      await this.helpers.verifyValidationError(this.selectors.passwordInput, expectedErrors.password);
    }
    if (expectedErrors.fullName) {
      await this.helpers.verifyValidationError(this.selectors.fullNameInput, expectedErrors.fullName);
    }
    if (expectedErrors.organizationName) {
      await this.helpers.verifyValidationError(this.selectors.organizationNameInput, expectedErrors.organizationName);
    }
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.page.locator(this.selectors.showPasswordButton).click();
  }

  /**
   * Verify password is visible/hidden
   */
  async verifyPasswordVisibility(isVisible: boolean): Promise<void> {
    const inputType = await this.page.locator(this.selectors.passwordInput).getAttribute('type');
    expect(inputType).toBe(isVisible ? 'text' : 'password');
  }

  /**
   * Click login link
   */
  async clickLoginLink(): Promise<void> {
    await this.helpers.clickButton(this.selectors.loginLinkButton);
  }

  /**
   * Verify loading state
   */
  async verifyLoadingState(isLoading = true): Promise<void> {
    await this.helpers.verifyLoadingState(this.selectors.submitButton, isLoading);
  }

  /**
   * Verify successful signup
   */
  async verifySuccessfulSignup(): Promise<void> {
    await this.helpers.verifyToast('Conta criada com sucesso', 'success');
    await this.helpers.verifyURL('/');
  }

  /**
   * Verify signup error
   */
  async verifySignupError(errorMessage: string): Promise<void> {
    await this.helpers.verifyToast(errorMessage, 'error');
  }

  /**
   * Test form field validations
   */
  async testFieldValidations(): Promise<void> {
    await this.goto();

    // Test empty form submission
    await this.submitForm();
    await this.verifyValidationErrors({
      email: 'Email é obrigatório',
      password: 'Senha é obrigatória',
      fullName: 'Nome completo é obrigatório',
      organizationName: 'Nome da organização é obrigatório'
    });

    // Test invalid email
    await this.helpers.fillField(this.selectors.emailInput, 'invalid-email');
    await this.submitForm();
    await this.verifyValidationErrors({
      email: 'Email inválido'
    });

    // Test weak password
    await this.helpers.fillField(this.selectors.passwordInput, '123');
    await this.submitForm();
    await this.verifyValidationErrors({
      password: 'Senha deve ter pelo menos 8 caracteres'
    });

    // Test password without special characters
    await this.helpers.fillField(this.selectors.passwordInput, 'Password123');
    await this.submitForm();
    await this.verifyValidationErrors({
      password: 'Senha deve conter: maiúscula, minúscula, número e símbolo'
    });
  }

  /**
   * Test responsive design
   */
  async testResponsive(): Promise<void> {
    await this.goto();

    // Test mobile layout
    await this.helpers.checkResponsive('mobile');
    await expect(this.page.locator(this.selectors.pageTitle)).toBeVisible();
    await this.helpers.takeScreenshot('signup-mobile');

    // Test tablet layout
    await this.helpers.checkResponsive('tablet');
    await expect(this.page.locator(this.selectors.pageTitle)).toBeVisible();
    await this.helpers.takeScreenshot('signup-tablet');

    // Test desktop layout
    await this.helpers.checkResponsive('desktop');
    await expect(this.page.locator(this.selectors.pageTitle)).toBeVisible();
    await this.helpers.takeScreenshot('signup-desktop');
  }
}