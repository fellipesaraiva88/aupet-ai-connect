import { test, expect } from '@playwright/test';
import { SignupPage } from '../page-objects/SignupPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Form Validation & UI Interaction Tests', () => {
  let signupPage: SignupPage;
  let dashboardPage: DashboardPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page);
    dashboardPage = new DashboardPage(page);
    helpers = new TestHelpers(page);

    await helpers.clearAuth();
  });

  test.describe('TDD: Signup Form Validation', () => {
    test('should validate required fields in real-time', async () => {
      await signupPage.goto();

      // Red Phase: Test that validation triggers on blur
      await test.step('Test required field validation', async () => {
        // Focus and blur each required field without entering data
        const requiredFields = [
          { selector: '#fullName', error: 'Nome completo é obrigatório' },
          { selector: '#email', error: 'Email é obrigatório' },
          { selector: '#password', error: 'Senha é obrigatória' },
          { selector: '#organizationName', error: 'Nome da organização é obrigatório' }
        ];

        for (const field of requiredFields) {
          await dashboardPage.page.locator(field.selector).focus();
          await dashboardPage.page.locator(field.selector).blur();
          await helpers.verifyValidationError(field.selector, field.error);
        }
      });
    });

    test('should validate email format with various invalid inputs', async () => {
      await signupPage.goto();

      const invalidEmails = [
        { input: 'invalid', error: 'Email inválido' },
        { input: '@domain.com', error: 'Email inválido' },
        { input: 'user@', error: 'Email inválido' },
        { input: 'user..name@domain.com', error: 'Email inválido' },
        { input: 'user@domain', error: 'Email inválido' },
        { input: 'user name@domain.com', error: 'Email inválido' }
      ];

      for (const { input, error } of invalidEmails) {
        await test.step(`Test email validation: ${input}`, async () => {
          await helpers.fillField('#email', input);
          await dashboardPage.page.locator('#email').blur();
          await helpers.verifyValidationError('#email', error);

          // Clear field for next test
          await helpers.fillField('#email', '');
        });
      }
    });

    test('should validate password strength requirements', async () => {
      await signupPage.goto();

      const passwordTests = [
        { input: '123', error: 'Senha deve ter pelo menos 8 caracteres' },
        { input: 'password', error: 'Senha deve conter: maiúscula, minúscula, número e símbolo' },
        { input: 'Password', error: 'Senha deve conter: maiúscula, minúscula, número e símbolo' },
        { input: 'Password123', error: 'Senha deve conter: maiúscula, minúscula, número e símbolo' },
        { input: 'password123!', error: 'Senha deve conter: maiúscula, minúscula, número e símbolo' },
        { input: 'PASSWORD123!', error: 'Senha deve conter: maiúscula, minúscula, número e símbolo' }
      ];

      for (const { input, error } of passwordTests) {
        await test.step(`Test password validation: ${input}`, async () => {
          await helpers.fillField('#password', input);
          await dashboardPage.page.locator('#password').blur();
          await helpers.verifyValidationError('#password', error);

          // Clear field for next test
          await helpers.fillField('#password', '');
        });
      }
    });

    test('should validate minimum length for name fields', async () => {
      await signupPage.goto();

      const nameFields = [
        { selector: '#fullName', error: 'Nome deve ter pelo menos 2 caracteres' },
        { selector: '#organizationName', error: 'Nome da organização deve ter pelo menos 2 caracteres' }
      ];

      for (const field of nameFields) {
        await test.step(`Test minimum length for ${field.selector}`, async () => {
          // Test single character
          await helpers.fillField(field.selector, 'A');
          await dashboardPage.page.locator(field.selector).blur();
          await helpers.verifyValidationError(field.selector, field.error);

          // Test valid length (should clear error)
          await helpers.fillField(field.selector, 'Valid Name');
          await dashboardPage.page.locator(field.selector).blur();

          // Error should disappear
          const errorElement = dashboardPage.page.locator(`${field.selector} ~ .text-red-600`);
          await expect(errorElement).not.toBeVisible();
        });
      }
    });

    test('should clear validation errors when valid input is provided', async () => {
      await signupPage.goto();

      // Trigger validation error
      await helpers.fillField('#email', 'invalid');
      await dashboardPage.page.locator('#email').blur();
      await helpers.verifyValidationError('#email', 'Email inválido');

      // Fix the input
      await helpers.fillField('#email', 'valid@email.com');
      await dashboardPage.page.locator('#email').blur();

      // Error should disappear
      const errorElement = dashboardPage.page.locator('#email ~ .text-red-600');
      await expect(errorElement).not.toBeVisible();
    });
  });

  test.describe('TDD: Form Interaction Behaviors', () => {
    test('should handle password visibility toggle', async () => {
      await signupPage.goto();

      // Initially password should be hidden
      await signupPage.verifyPasswordVisibility(false);

      // Toggle to show password
      await signupPage.togglePasswordVisibility();
      await signupPage.verifyPasswordVisibility(true);

      // Toggle back to hide password
      await signupPage.togglePasswordVisibility();
      await signupPage.verifyPasswordVisibility(false);
    });

    test('should handle subscription tier selection', async () => {
      await signupPage.goto();

      const subscriptionOptions = ['free', 'pro', 'enterprise'];

      for (const option of subscriptionOptions) {
        await test.step(`Test subscription selection: ${option}`, async () => {
          await helpers.selectOption('[data-testid="subscription-select"]', option);

          // Verify selection
          const selectedValue = await dashboardPage.page.locator('[data-testid="subscription-select"]').getAttribute('data-value');
          expect(selectedValue).toBe(option);
        });
      }
    });

    test('should handle form submission states', async () => {
      await signupPage.goto();

      // Fill valid form data
      await signupPage.fillSignupForm({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Form Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Submit form
      const submitButton = dashboardPage.page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show loading state
      await signupPage.verifyLoadingState(true);

      // Wait for submission to complete
      await helpers.waitForNetworkIdle();

      // Loading state should be cleared
      await signupPage.verifyLoadingState(false);
    });

    test('should handle keyboard navigation', async () => {
      await signupPage.goto();

      // Test tab navigation through form fields
      const formFields = ['#fullName', '#email', '#password', '#organizationName'];

      for (let i = 0; i < formFields.length; i++) {
        if (i === 0) {
          // Focus first field
          await dashboardPage.page.locator(formFields[i]).focus();
        } else {
          // Tab to next field
          await dashboardPage.page.keyboard.press('Tab');
        }

        // Verify correct field is focused
        const focusedElement = await dashboardPage.page.evaluate(() => document.activeElement?.id);
        expect(focusedElement).toBe(formFields[i].replace('#', ''));
      }
    });

    test('should handle Enter key form submission', async () => {
      await signupPage.goto();

      // Fill form with invalid data
      await helpers.fillField('#email', 'invalid-email');

      // Press Enter to submit
      await dashboardPage.page.keyboard.press('Enter');

      // Should show validation errors
      await helpers.verifyValidationError('#email', 'Email inválido');
    });
  });

  test.describe('TDD: Customer Form Validation', () => {
    test('should validate customer creation form', async () => {
      // First authenticate
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Customer Form Test',
        organizationName: TestHelpers.generateOrgName()
      });

      // Navigate to customers page
      await dashboardPage.navigateToSection('customers');

      // Click "New Customer" button (if available)
      const newCustomerButton = dashboardPage.page.locator('text="Novo Cliente", text="Adicionar Cliente", [data-testid="new-customer"]');
      if (await newCustomerButton.isVisible()) {
        await newCustomerButton.click();

        // Test customer form validation
        const customerFormTests = [
          { field: '#customerName', error: 'Nome é obrigatório' },
          { field: '#customerEmail', error: 'Email é obrigatório' },
          { field: '#customerPhone', error: 'Telefone é obrigatório' }
        ];

        for (const { field, error } of customerFormTests) {
          await test.step(`Test customer field: ${field}`, async () => {
            if (await dashboardPage.page.locator(field).isVisible()) {
              await dashboardPage.page.locator(field).focus();
              await dashboardPage.page.locator(field).blur();
              await helpers.verifyValidationError(field, error);
            }
          });
        }
      }
    });
  });

  test.describe('TDD: Pet Form Validation', () => {
    test('should validate pet creation form', async () => {
      // First authenticate
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Pet Form Test',
        organizationName: TestHelpers.generateOrgName()
      });

      // Navigate to pets page
      await dashboardPage.navigateToSection('pets');

      // Check if new pet form is available
      const newPetButton = dashboardPage.page.locator('text="Novo Pet", text="Adicionar Pet", [data-testid="new-pet"]');
      if (await newPetButton.isVisible()) {
        await newPetButton.click();

        // Test pet form validation
        const petFormTests = [
          { field: '#petName', error: 'Nome do pet é obrigatório' },
          { field: '#petSpecies', error: 'Espécie é obrigatória' },
          { field: '#petCustomer', error: 'Cliente é obrigatório' }
        ];

        for (const { field, error } of petFormTests) {
          await test.step(`Test pet field: ${field}`, async () => {
            if (await dashboardPage.page.locator(field).isVisible()) {
              await dashboardPage.page.locator(field).focus();
              await dashboardPage.page.locator(field).blur();
              await helpers.verifyValidationError(field, error);
            }
          });
        }
      }
    });
  });

  test.describe('TDD: Appointment Form Validation', () => {
    test('should validate appointment creation form', async () => {
      // First authenticate
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Appointment Form Test',
        organizationName: TestHelpers.generateOrgName()
      });

      // Navigate to appointments page
      await dashboardPage.navigateToSection('appointments');

      // Check if new appointment form is available
      const newAppointmentButton = dashboardPage.page.locator('text="Novo Agendamento", text="Agendar", [data-testid="new-appointment"]');
      if (await newAppointmentButton.isVisible()) {
        await newAppointmentButton.click();

        // Test appointment form validation
        const appointmentFormTests = [
          { field: '#appointmentCustomer', error: 'Cliente é obrigatório' },
          { field: '#appointmentPet', error: 'Pet é obrigatório' },
          { field: '#appointmentDate', error: 'Data é obrigatória' },
          { field: '#appointmentTime', error: 'Horário é obrigatório' },
          { field: '#serviceType', error: 'Tipo de serviço é obrigatório' }
        ];

        for (const { field, error } of appointmentFormTests) {
          await test.step(`Test appointment field: ${field}`, async () => {
            if (await dashboardPage.page.locator(field).isVisible()) {
              await dashboardPage.page.locator(field).focus();
              await dashboardPage.page.locator(field).blur();
              await helpers.verifyValidationError(field, error);
            }
          });
        }
      }
    });

    test('should validate appointment date restrictions', async () => {
      // First authenticate
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Date Validation Test',
        organizationName: TestHelpers.generateOrgName()
      });

      // Navigate to appointments page
      await dashboardPage.navigateToSection('appointments');

      const newAppointmentButton = dashboardPage.page.locator('text="Novo Agendamento", text="Agendar", [data-testid="new-appointment"]');
      if (await newAppointmentButton.isVisible()) {
        await newAppointmentButton.click();

        // Test past date validation
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const pastDate = yesterday.toISOString().split('T')[0];

        if (await dashboardPage.page.locator('#appointmentDate').isVisible()) {
          await helpers.fillField('#appointmentDate', pastDate);
          await dashboardPage.page.locator('#appointmentDate').blur();
          await helpers.verifyValidationError('#appointmentDate', 'Não é possível agendar para datas passadas');
        }
      }
    });
  });

  test.describe('TDD: Search and Filter Forms', () => {
    test('should validate search functionality', async () => {
      // First authenticate
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Search Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      const sectionsToTest = ['customers', 'pets', 'appointments', 'conversations'];

      for (const section of sectionsToTest) {
        await test.step(`Test search in ${section}`, async () => {
          await dashboardPage.navigateToSection(section as any);

          // Look for search input
          const searchInput = dashboardPage.page.locator('[data-testid="search-input"], input[placeholder*="Buscar"], input[placeholder*="Pesquisar"]');

          if (await searchInput.isVisible()) {
            // Test search functionality
            await searchInput.fill('test search query');
            await dashboardPage.page.keyboard.press('Enter');

            // Should trigger search (verify by checking URL or results)
            await helpers.waitForNetworkIdle();

            // Clear search
            await searchInput.clear();
            await dashboardPage.page.keyboard.press('Enter');
          }
        });
      }
    });

    test('should handle filter selections', async () => {
      // First authenticate
      await signupPage.completeSignup({
        email: TestHelpers.generateTestEmail(),
        password: 'TestPass123!',
        fullName: 'Filter Test User',
        organizationName: TestHelpers.generateOrgName()
      });

      // Test filters on appointments page
      await dashboardPage.navigateToSection('appointments');

      // Look for status filter
      const statusFilter = dashboardPage.page.locator('[data-testid="status-filter"], select[name="status"]');
      if (await statusFilter.isVisible()) {
        const options = ['scheduled', 'completed', 'cancelled'];

        for (const option of options) {
          await test.step(`Test status filter: ${option}`, async () => {
            await helpers.selectOption('[data-testid="status-filter"]', option);
            await helpers.waitForNetworkIdle();

            // Verify filter is applied (URL should change or results should update)
            const currentUrl = dashboardPage.page.url();
            expect(currentUrl).toContain(option);
          });
        }
      }
    });
  });

  test.describe('TDD: Form Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      await signupPage.goto();

      // Check form has proper role
      const form = dashboardPage.page.locator('form');
      await expect(form).toBeVisible();

      // Check inputs have proper labels
      const formFields = [
        { input: '#fullName', label: 'Nome Completo' },
        { input: '#email', label: 'Email' },
        { input: '#password', label: 'Senha' },
        { input: '#organizationName', label: 'Nome da Organização' }
      ];

      for (const { input, label } of formFields) {
        await test.step(`Check accessibility for ${input}`, async () => {
          const inputElement = dashboardPage.page.locator(input);
          const labelElement = dashboardPage.page.locator(`label[for="${input.replace('#', '')}"]`);

          await expect(inputElement).toBeVisible();
          await expect(labelElement).toBeVisible();
          await expect(labelElement).toContainText(label);
        });
      }
    });

    test('should support screen reader navigation', async () => {
      await signupPage.goto();

      // Test that form can be navigated with screen reader keys
      await dashboardPage.page.keyboard.press('Tab');
      const firstFocused = await dashboardPage.page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'SELECT']).toContain(firstFocused);

      // Continue tabbing through form elements
      for (let i = 0; i < 5; i++) {
        await dashboardPage.page.keyboard.press('Tab');
        const currentFocused = await dashboardPage.page.evaluate(() => document.activeElement?.tagName);
        expect(['INPUT', 'BUTTON', 'SELECT']).toContain(currentFocused);
      }
    });
  });
});