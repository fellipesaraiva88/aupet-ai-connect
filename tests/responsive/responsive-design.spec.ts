import { test, expect } from '@playwright/test';
import { SignupPage } from '../page-objects/SignupPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Responsive Design & UX Validation Tests', () => {
  let signupPage: SignupPage;
  let dashboardPage: DashboardPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page);
    dashboardPage = new DashboardPage(page);
    helpers = new TestHelpers(page);

    await helpers.clearAuth();
  });

  test.describe('TDD: Multi-Device Responsive Testing', () => {
    const devices = [
      { name: 'mobile', viewport: { width: 375, height: 667 } },
      { name: 'tablet', viewport: { width: 768, height: 1024 } },
      { name: 'desktop', viewport: { width: 1280, height: 720 } },
      { name: 'large-desktop', viewport: { width: 1920, height: 1080 } }
    ];

    for (const device of devices) {
      test(`should render correctly on ${device.name}`, async () => {
        await dashboardPage.page.setViewportSize(device.viewport);

        // Test signup page responsiveness
        await test.step(`Test signup page on ${device.name}`, async () => {
          await signupPage.goto();

          // Page should be visible and functional
          await expect(signupPage.page.locator(signupPage.selectors.pageTitle)).toBeVisible();
          await expect(signupPage.page.locator(signupPage.selectors.submitButton)).toBeVisible();

          // Form should be properly sized
          const form = signupPage.page.locator('form');
          const formBox = await form.boundingBox();

          if (formBox) {
            expect(formBox.width).toBeLessThanOrEqual(device.viewport.width);
            expect(formBox.width).toBeGreaterThan(200); // Minimum usable width
          }

          await helpers.takeScreenshot(`signup-${device.name}`);
        });

        // Complete signup to test dashboard
        const userData = await signupPage.completeSignup({
          email: TestHelpers.generateTestEmail(),
          password: 'TestPass123!',
          fullName: `${device.name} User`,
          organizationName: TestHelpers.generateOrgName()
        });

        // Test dashboard responsiveness
        await test.step(`Test dashboard on ${device.name}`, async () => {
          await dashboardPage.verifyDashboardLoaded();

          // Check if sidebar behavior is appropriate for device
          const sidebar = dashboardPage.page.locator(dashboardPage.selectors.sidebar);

          if (device.viewport.width < 768) {
            // Mobile: sidebar might be hidden or collapsible
            const isVisible = await sidebar.isVisible();
            if (isVisible) {
              // If visible, should not take up too much screen space
              const sidebarBox = await sidebar.boundingBox();
              if (sidebarBox) {
                expect(sidebarBox.width).toBeLessThan(device.viewport.width * 0.8);
              }
            }
          } else {
            // Tablet and desktop: sidebar should be visible
            await expect(sidebar).toBeVisible();
          }

          await helpers.takeScreenshot(`dashboard-${device.name}`);
        });

        // Test navigation on each device
        await test.step(`Test navigation on ${device.name}`, async () => {
          const sections = ['customers', 'pets', 'appointments'];

          for (const section of sections) {
            await dashboardPage.navigateToSection(section as any);

            // Page should load properly
            await helpers.waitForNetworkIdle();

            // Content should be visible
            const mainContent = dashboardPage.page.locator('main, [role="main"], .main-content');
            await expect(mainContent).toBeVisible();

            await helpers.takeScreenshot(`${section}-${device.name}`);

            // Go back to dashboard
            await dashboardPage.goto();
          }
        });
      });
    }
  });

  test.describe('TDD: Touch and Mobile Interactions', () => {
    test('should handle touch interactions on mobile', async () => {
      await helpers.checkResponsive('mobile');

      // Complete signup first
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Touch Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      await test.step('Test touch navigation', async () => {
        // Test tap interactions
        const navItems = dashboardPage.page.locator('[data-testid="nav-item"], .nav-item, nav a');
        const count = await navItems.count();

        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const item = navItems.nth(i);
            if (await item.isVisible()) {
              await item.tap();
              await helpers.waitForNetworkIdle();
            }
          }
        }
      });

      await test.step('Test swipe gestures', async () => {
        // Test horizontal swipe on mobile (if applicable)
        const swipeableElements = dashboardPage.page.locator('[data-testid="swipeable"], .swipeable, .carousel');
        const count = await swipeableElements.count();

        if (count > 0) {
          const element = swipeableElements.first();
          const box = await element.boundingBox();

          if (box) {
            // Perform swipe gesture
            await dashboardPage.page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
            await dashboardPage.page.mouse.down();
            await dashboardPage.page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
            await dashboardPage.page.mouse.up();
          }
        }
      });

      await test.step('Test pinch zoom prevention', async () => {
        // Check that viewport is configured to prevent unwanted zoom
        const viewportMeta = await dashboardPage.page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewportMeta).toContain('user-scalable=no');
      });
    });

    test('should have appropriate touch target sizes', async () => {
      await helpers.checkResponsive('mobile');
      await signupPage.goto();

      // Test that interactive elements meet minimum touch target size (44px)
      const interactiveElements = [
        'button',
        'a',
        'input[type="checkbox"]',
        'input[type="radio"]',
        '[role="button"]',
        '.clickable'
      ];

      for (const selector of interactiveElements) {
        const elements = dashboardPage.page.locator(selector);
        const count = await elements.count();

        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const box = await element.boundingBox();
            if (box) {
              // Check minimum touch target size (44px recommended)
              expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(40);
            }
          }
        }
      }
    });
  });

  test.describe('TDD: Layout Breakpoints and Grid System', () => {
    test('should handle layout changes at breakpoints', async () => {
      // Complete signup first
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Breakpoint Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      const breakpoints = [
        { name: 'mobile', width: 375 },
        { name: 'tablet-portrait', width: 768 },
        { name: 'tablet-landscape', width: 1024 },
        { name: 'desktop', width: 1280 },
        { name: 'large-desktop', width: 1920 }
      ];

      for (const breakpoint of breakpoints) {
        await test.step(`Test layout at ${breakpoint.name} (${breakpoint.width}px)`, async () => {
          await dashboardPage.page.setViewportSize({ width: breakpoint.width, height: 720 });
          await dashboardPage.goto();

          // Test grid layout
          const gridContainers = dashboardPage.page.locator('.grid, [class*="grid"], .flex, [class*="flex"]');
          const count = await gridContainers.count();

          if (count > 0) {
            const container = gridContainers.first();
            const containerBox = await container.boundingBox();

            if (containerBox) {
              // Container should not overflow viewport
              expect(containerBox.width).toBeLessThanOrEqual(breakpoint.width);

              // Check child elements arrangement
              const children = container.locator('> *');
              const childCount = await children.count();

              if (childCount > 1) {
                const firstChild = await children.first().boundingBox();
                const lastChild = await children.last().boundingBox();

                if (firstChild && lastChild) {
                  // On mobile, items should stack vertically (y difference)
                  // On desktop, items might be horizontal (x difference)
                  if (breakpoint.width < 768) {
                    expect(lastChild.y).toBeGreaterThan(firstChild.y);
                  }
                }
              }
            }
          }

          await helpers.takeScreenshot(`layout-${breakpoint.name}`);
        });
      }
    });

    test('should handle content overflow properly', async () => {
      // Complete signup
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Overflow Test User With Very Long Name That Might Cause Issues',
        organizationName: TestHelpers.generateOrgName()
      });

      await helpers.checkResponsive('mobile');

      // Check for horizontal scrollbars (usually unwanted on mobile)
      const bodyScrollWidth = await dashboardPage.page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await dashboardPage.page.evaluate(() => document.body.clientWidth);

      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 5); // Allow 5px tolerance

      // Check that text content doesn't overflow containers
      const textElements = dashboardPage.page.locator('p, span, div[class*="text"], h1, h2, h3, h4, h5, h6');
      const count = await textElements.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          if (box) {
            expect(box.x + box.width).toBeLessThanOrEqual(375 + 10); // Mobile width + tolerance
          }
        }
      }
    });
  });

  test.describe('TDD: Accessibility and Screen Reader Support', () => {
    test('should maintain accessibility across devices', async () => {
      await signupPage.goto();

      const deviceSizes = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'desktop', width: 1280, height: 720 }
      ];

      for (const device of deviceSizes) {
        await test.step(`Test accessibility on ${device.name}`, async () => {
          await dashboardPage.page.setViewportSize(device);

          // Check color contrast (simplified check)
          const buttons = dashboardPage.page.locator('button');
          const buttonCount = await buttons.count();

          for (let i = 0; i < Math.min(buttonCount, 3); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              const styles = await button.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return {
                  backgroundColor: computed.backgroundColor,
                  color: computed.color,
                  fontSize: computed.fontSize
                };
              });

              // Font size should be readable (at least 14px)
              const fontSize = parseInt(styles.fontSize);
              expect(fontSize).toBeGreaterThanOrEqual(14);
            }
          }

          // Check that interactive elements have proper focus states
          await dashboardPage.page.keyboard.press('Tab');
          const focusedElement = await dashboardPage.page.evaluate(() => document.activeElement?.tagName);
          expect(['INPUT', 'BUTTON', 'A', 'SELECT']).toContain(focusedElement);
        });
      }
    });

    test('should support high contrast mode', async () => {
      await signupPage.goto();

      // Simulate high contrast mode by checking if elements remain visible
      await dashboardPage.page.emulateMedia({ colorScheme: 'dark' });

      // Key elements should still be visible in dark mode
      await expect(signupPage.page.locator(signupPage.selectors.pageTitle)).toBeVisible();
      await expect(signupPage.page.locator(signupPage.selectors.submitButton)).toBeVisible();
      await expect(signupPage.page.locator(signupPage.selectors.emailInput)).toBeVisible();

      await helpers.takeScreenshot('dark-mode-signup');

      // Switch back to light mode
      await dashboardPage.page.emulateMedia({ colorScheme: 'light' });
    });
  });

  test.describe('TDD: Performance on Different Devices', () => {
    test('should load quickly on mobile networks', async () => {
      // Simulate slow 3G network
      await dashboardPage.page.route('**/*', async (route) => {
        // Add delay to simulate slow network
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });

      await helpers.checkResponsive('mobile');

      const startTime = Date.now();
      await signupPage.goto();
      await helpers.waitForNetworkIdle();
      const loadTime = Date.now() - startTime;

      // Page should load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should handle slow image loading gracefully', async () => {
      await helpers.checkResponsive('mobile');

      // Simulate slow image loading
      await dashboardPage.page.route('**/*.{png,jpg,jpeg,webp,svg}', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      await signupPage.goto();

      // Page should be functional even while images are loading
      await expect(signupPage.page.locator(signupPage.selectors.pageTitle)).toBeVisible();
      await expect(signupPage.page.locator(signupPage.selectors.submitButton)).toBeVisible();

      // Check for loading states or placeholder images
      const images = dashboardPage.page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        // Images should have proper alt text or loading states
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          const loading = await img.getAttribute('loading');

          // Either has alt text or is marked as decorative
          expect(alt !== null || loading === 'lazy').toBeTruthy();
        }
      }
    });
  });

  test.describe('TDD: Cross-Browser Responsive Consistency', () => {
    test('should maintain layout consistency across viewports', async () => {
      // Test the same layout on different viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 812 }, // iPhone X
        { width: 414, height: 896 }, // iPhone XS Max
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // iPad Landscape
        { width: 1366, height: 768 }, // Common laptop
        { width: 1920, height: 1080 } // Full HD
      ];

      // Complete signup once
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Viewport Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      for (const viewport of viewports) {
        await test.step(`Test viewport ${viewport.width}x${viewport.height}`, async () => {
          await dashboardPage.page.setViewportSize(viewport);
          await dashboardPage.goto();

          // Check that essential elements are visible
          await dashboardPage.verifyDashboardLoaded();

          // Check that metrics cards adapt to viewport
          const metricsContainer = dashboardPage.page.locator('[data-testid="stats-overview"]');
          if (await metricsContainer.isVisible()) {
            const containerBox = await metricsContainer.boundingBox();
            if (containerBox) {
              expect(containerBox.width).toBeLessThanOrEqual(viewport.width);
            }
          }

          // Take screenshot for visual comparison
          await helpers.takeScreenshot(`viewport-${viewport.width}x${viewport.height}`);
        });
      }
    });
  });

  test.describe('TDD: Interactive Element Responsiveness', () => {
    test('should handle dropdown menus on different screen sizes', async () => {
      // Complete signup
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Dropdown Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      const screenSizes = ['mobile', 'tablet', 'desktop'] as const;

      for (const size of screenSizes) {
        await test.step(`Test dropdowns on ${size}`, async () => {
          await helpers.checkResponsive(size);
          await dashboardPage.goto();

          // Find dropdown elements
          const dropdowns = dashboardPage.page.locator('select, [role="combobox"], [data-testid*="select"]');
          const count = await dropdowns.count();

          if (count > 0) {
            const dropdown = dropdowns.first();
            if (await dropdown.isVisible()) {
              await dropdown.click();

              // Dropdown content should be visible and properly positioned
              const dropdownContent = dashboardPage.page.locator('[role="listbox"], .dropdown-content, [data-testid*="options"]');
              if (await dropdownContent.isVisible()) {
                const contentBox = await dropdownContent.boundingBox();
                if (contentBox) {
                  // Content should not overflow viewport
                  const viewport = dashboardPage.page.viewportSize();
                  if (viewport) {
                    expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(viewport.width);
                    expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(viewport.height);
                  }
                }
              }

              // Close dropdown
              await dashboardPage.page.keyboard.press('Escape');
            }
          }
        });
      }
    });

    test('should handle modal dialogs responsively', async () => {
      // Complete signup
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Modal Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      const screenSizes = ['mobile', 'tablet', 'desktop'] as const;

      for (const size of screenSizes) {
        await test.step(`Test modals on ${size}`, async () => {
          await helpers.checkResponsive(size);
          await dashboardPage.goto();

          // Look for buttons that might trigger modals
          const modalTriggers = dashboardPage.page.locator('[data-testid*="modal"], [data-testid*="dialog"], button:has-text("Adicionar"), button:has-text("Novo")');
          const count = await modalTriggers.count();

          if (count > 0) {
            const trigger = modalTriggers.first();
            if (await trigger.isVisible()) {
              await trigger.click();

              // Check if modal appears
              const modal = dashboardPage.page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
              if (await modal.isVisible()) {
                const modalBox = await modal.boundingBox();
                const viewport = dashboardPage.page.viewportSize();

                if (modalBox && viewport) {
                  // Modal should fit within viewport with some margin
                  expect(modalBox.width).toBeLessThanOrEqual(viewport.width - 20);
                  expect(modalBox.height).toBeLessThanOrEqual(viewport.height - 20);

                  // On mobile, modal might be full-width
                  if (viewport.width < 768) {
                    expect(modalBox.width).toBeGreaterThan(viewport.width * 0.8);
                  }
                }

                // Close modal
                const closeButton = modal.locator('[aria-label="Close"], button:has-text("Fechar"), button:has-text("Cancelar")');
                if (await closeButton.isVisible()) {
                  await closeButton.click();
                } else {
                  await dashboardPage.page.keyboard.press('Escape');
                }
              }
            }
          }
        });
      }
    });
  });
});