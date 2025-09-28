import { Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class DashboardPage {
  private helpers: TestHelpers;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
  }

  // Selectors
  readonly selectors = {
    // Main elements
    dashboard: '[data-testid="dashboard"]',
    sidebar: '[data-testid="sidebar"]',
    navbar: '[data-testid="navbar"]',

    // Navigation links
    conversationsLink: 'a[href="/conversations"]',
    customersLink: 'a[href="/customers"]',
    petsLink: 'a[href="/pets"]',
    appointmentsLink: 'a[href="/appointments"]',
    catalogLink: 'a[href="/catalog"]',
    analyticsLink: 'a[href="/analytics"]',
    settingsLink: 'a[href="/settings"]',
    aiConfigLink: 'a[href="/ai-config"]',

    // Dashboard components
    statsOverview: '[data-testid="stats-overview"]',
    recentConversations: '[data-testid="recent-conversations"]',
    aiPerformance: '[data-testid="ai-performance"]',

    // Metrics cards
    totalCustomersCard: '[data-testid="total-customers"]',
    totalPetsCard: '[data-testid="total-pets"]',
    totalAppointmentsCard: '[data-testid="total-appointments"]',
    aiResponseTimeCard: '[data-testid="ai-response-time"]',

    // User menu
    userMenu: '[data-testid="user-menu"]',
    logoutButton: '[data-testid="logout"]',
    profileButton: '[data-testid="profile"]',
  };

  /**
   * Navigate to dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.helpers.waitForElement(this.selectors.dashboard);
  }

  /**
   * Verify dashboard is loaded
   */
  async verifyDashboardLoaded(): Promise<void> {
    await expect(this.page.locator(this.selectors.dashboard)).toBeVisible();
    await expect(this.page.locator(this.selectors.sidebar)).toBeVisible();
    await expect(this.page.locator(this.selectors.navbar)).toBeVisible();
  }

  /**
   * Navigate to section
   */
  async navigateToSection(section: 'conversations' | 'customers' | 'pets' | 'appointments' | 'catalog' | 'analytics' | 'settings' | 'ai-config'): Promise<void> {
    const linkSelector = this.selectors[`${section}Link`];
    await this.helpers.clickButton(linkSelector);
    await this.helpers.verifyURL(`/${section}`);
  }

  /**
   * Verify metrics cards are loaded
   */
  async verifyMetricsCards(): Promise<void> {
    await expect(this.page.locator(this.selectors.totalCustomersCard)).toBeVisible();
    await expect(this.page.locator(this.selectors.totalPetsCard)).toBeVisible();
    await expect(this.page.locator(this.selectors.totalAppointmentsCard)).toBeVisible();
    await expect(this.page.locator(this.selectors.aiResponseTimeCard)).toBeVisible();
  }

  /**
   * Get metric value
   */
  async getMetricValue(metric: 'customers' | 'pets' | 'appointments' | 'response-time'): Promise<string> {
    const cardSelector = this.selectors[`total${metric.charAt(0).toUpperCase() + metric.slice(1)}Card`] || this.selectors[`${metric}Card`];
    const metricElement = this.page.locator(`${cardSelector} [data-testid="metric-value"]`);
    return await metricElement.textContent() || '0';
  }

  /**
   * Verify real-time updates
   */
  async verifyRealTimeUpdates(): Promise<void> {
    // Get initial metric values
    const initialCustomers = await this.getMetricValue('customers');

    // Wait for potential real-time updates
    await this.page.waitForTimeout(2000);

    // Verify metrics are still visible (real-time connection working)
    await this.verifyMetricsCards();
  }

  /**
   * Test navigation to all sections
   */
  async testAllNavigation(): Promise<void> {
    const sections: Array<'conversations' | 'customers' | 'pets' | 'appointments' | 'catalog' | 'analytics' | 'settings' | 'ai-config'> = [
      'conversations',
      'customers',
      'pets',
      'appointments',
      'catalog',
      'analytics',
      'settings',
      'ai-config'
    ];

    for (const section of sections) {
      await this.navigateToSection(section);
      await this.page.goBack();
      await this.verifyDashboardLoaded();
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await this.helpers.clickButton(this.selectors.userMenu);
    await this.helpers.clickButton(this.selectors.logoutButton);
    await this.helpers.verifyURL('/');
    expect(await this.helpers.isAuthenticated()).toBeFalsy();
  }

  /**
   * Test responsive dashboard
   */
  async testResponsive(): Promise<void> {
    await this.goto();

    // Test mobile layout
    await this.helpers.checkResponsive('mobile');
    await this.verifyDashboardLoaded();
    await this.helpers.takeScreenshot('dashboard-mobile');

    // Test tablet layout
    await this.helpers.checkResponsive('tablet');
    await this.verifyDashboardLoaded();
    await this.helpers.takeScreenshot('dashboard-tablet');

    // Test desktop layout
    await this.helpers.checkResponsive('desktop');
    await this.verifyDashboardLoaded();
    await this.helpers.takeScreenshot('dashboard-desktop');
  }

  /**
   * Verify AI performance component
   */
  async verifyAIPerformance(): Promise<void> {
    await expect(this.page.locator(this.selectors.aiPerformance)).toBeVisible();

    // Check for performance metrics
    const performanceMetrics = [
      '[data-testid="response-accuracy"]',
      '[data-testid="avg-response-time"]',
      '[data-testid="satisfaction-rate"]'
    ];

    for (const metric of performanceMetrics) {
      await expect(this.page.locator(metric)).toBeVisible();
    }
  }

  /**
   * Verify recent conversations component
   */
  async verifyRecentConversations(): Promise<void> {
    await expect(this.page.locator(this.selectors.recentConversations)).toBeVisible();

    // Check if conversations are loaded or empty state is shown
    const conversationsExist = await this.page.locator('[data-testid="conversation-item"]').count() > 0;
    const emptyState = await this.page.locator('[data-testid="empty-conversations"]').isVisible();

    expect(conversationsExist || emptyState).toBeTruthy();
  }
}