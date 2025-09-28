import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Generate unique test email
   */
  static generateTestEmail(): string {
    const timestamp = Date.now();
    return `test.user.${timestamp}@auzap-test.com`;
  }

  /**
   * Generate unique organization name
   */
  static generateOrgName(): string {
    const timestamp = Date.now();
    return `Test Org ${timestamp}`;
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(timeout = 10000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Wait for element to be visible and enabled
   */
  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout
    });
    await expect(this.page.locator(selector)).toBeEnabled();
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string, options?: {
    clear?: boolean;
    validate?: boolean;
  }): Promise<void> {
    const { clear = true, validate = true } = options || {};

    await this.waitForElement(selector);

    if (clear) {
      await this.page.locator(selector).clear();
    }

    await this.page.locator(selector).fill(value);

    if (validate) {
      await expect(this.page.locator(selector)).toHaveValue(value);
    }
  }

  /**
   * Click button and wait for response
   */
  async clickButton(selector: string, options?: {
    waitForResponse?: string;
    timeout?: number;
  }): Promise<void> {
    const { waitForResponse, timeout = 10000 } = options || {};

    await this.waitForElement(selector, timeout);

    if (waitForResponse) {
      const responsePromise = this.page.waitForResponse(
        resp => resp.url().includes(waitForResponse) && resp.status() < 400,
        { timeout }
      );

      await this.page.locator(selector).click();
      await responsePromise;
    } else {
      await this.page.locator(selector).click();
    }
  }

  /**
   * Select dropdown option
   */
  async selectOption(triggerSelector: string, optionValue: string): Promise<void> {
    await this.waitForElement(triggerSelector);
    await this.page.locator(triggerSelector).click();

    await this.page.waitForSelector(`[data-value="${optionValue}"]`, {
      state: 'visible'
    });
    await this.page.locator(`[data-value="${optionValue}"]`).click();
  }

  /**
   * Verify toast message
   */
  async verifyToast(expectedText: string, type: 'success' | 'error' = 'success'): Promise<void> {
    const toastSelector = type === 'success'
      ? '[data-testid="toast-success"], .toast:not(.destructive)'
      : '[data-testid="toast-error"], .toast.destructive';

    await this.page.waitForSelector(toastSelector, {
      state: 'visible',
      timeout: 5000
    });

    const toast = this.page.locator(toastSelector);
    await expect(toast).toContainText(expectedText);
  }

  /**
   * Verify page URL
   */
  async verifyURL(expectedPath: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem('accessToken'));
    return !!token;
  }

  /**
   * Clear authentication state
   */
  async clearAuth(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });
  }

  /**
   * Set authentication state
   */
  async setAuth(tokens: {
    accessToken: string;
    refreshToken: string;
    user: any
  }): Promise<void> {
    await this.page.evaluate((data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }, tokens);
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string, timeout = 10000): Promise<any> {
    const response = await this.page.waitForResponse(
      resp => resp.url().includes(urlPattern),
      { timeout }
    );

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Verify form validation error
   */
  async verifyValidationError(fieldSelector: string, expectedError: string): Promise<void> {
    const errorSelector = `${fieldSelector} + .text-red-600, ${fieldSelector} ~ .text-red-600`;
    await this.page.waitForSelector(errorSelector, { state: 'visible' });
    await expect(this.page.locator(errorSelector)).toContainText(expectedError);
  }

  /**
   * Check responsive layout
   */
  async checkResponsive(breakpoint: 'mobile' | 'tablet' | 'desktop'): Promise<void> {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 }
    };

    await this.page.setViewportSize(viewports[breakpoint]);
    await this.waitForNetworkIdle();
  }

  /**
   * Take screenshot with name
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }

  /**
   * Verify loading state
   */
  async verifyLoadingState(selector: string, isLoading = true): Promise<void> {
    if (isLoading) {
      await expect(this.page.locator(selector)).toHaveAttribute('disabled', '');
      await expect(this.page.locator('.animate-spin')).toBeVisible();
    } else {
      await expect(this.page.locator(selector)).not.toHaveAttribute('disabled', '');
      await expect(this.page.locator('.animate-spin')).not.toBeVisible();
    }
  }
}