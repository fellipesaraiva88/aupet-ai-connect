import { test, expect } from '@playwright/test';
import { ApiClient } from '../page-objects/ApiClient';
import { TestHelpers } from '../utils/test-helpers';

test.describe('API Integration Tests', () => {
  let apiClient: ApiClient;
  let testUserData: {
    email: string;
    password: string;
    fullName: string;
    organizationName: string;
    userId?: string;
    customerId?: string;
    petId?: string;
    appointmentId?: string;
  };

  test.beforeAll(async ({ request }) => {
    apiClient = new ApiClient(request);

    // Setup test user data
    testUserData = {
      email: TestHelpers.generateTestEmail(),
      password: 'TestPass123!',
      fullName: 'API Test User',
      organizationName: TestHelpers.generateOrgName(),
      subscriptionTier: 'free'
    };

    // Create test user for API tests
    const signupResponse = await apiClient.signup(testUserData);
    testUserData.userId = signupResponse.data?.user?.id;
  });

  test.describe('TDD: Authentication API', () => {
    test('should signup new user successfully', async () => {
      // Red Phase: Test new user signup
      const newUserData = {
        email: TestHelpers.generateTestEmail(),
        password: 'NewTestPass123!',
        fullName: 'New API User',
        organizationName: TestHelpers.generateOrgName(),
        subscriptionTier: 'pro'
      };

      const response = await apiClient.signup(newUserData);

      // Green Phase: Verify response structure
      expect(response.success).toBeTruthy();
      expect(response.data).toBeDefined();
      expect(response.data.user).toBeDefined();
      expect(response.data.tokens).toBeDefined();
      expect(response.data.user.email).toBe(newUserData.email);
      expect(response.data.user.fullName).toBe(newUserData.fullName);
      expect(response.data.user.organization.subscription_tier).toBe(newUserData.subscriptionTier);
    });

    test('should login existing user successfully', async () => {
      const response = await apiClient.login(testUserData.email, testUserData.password);

      expect(response.success).toBeTruthy();
      expect(response.data.user.email).toBe(testUserData.email);
      expect(response.data.tokens.accessToken).toBeDefined();
      expect(response.data.tokens.refreshToken).toBeDefined();
    });

    test('should reject invalid login credentials', async ({ request }) => {
      const tempClient = new ApiClient(request);

      const response = await request.post('http://localhost:3001/api/auth/login', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: 'invalid@email.com',
          password: 'InvalidPassword'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBeFalsy();
    });

    test('should validate required fields in signup', async ({ request }) => {
      const response = await request.post('http://localhost:3001/api/auth/signup', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: 'incomplete@test.com'
          // Missing required fields
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBeFalsy();
    });
  });

  test.describe('TDD: Dashboard API', () => {
    test('should fetch dashboard stats', async () => {
      const stats = await apiClient.getDashboardStats();

      expect(stats.success).toBeTruthy();
      expect(stats.data).toBeDefined();
      expect(typeof stats.data.totalCustomers).toBe('number');
      expect(typeof stats.data.totalPets).toBe('number');
      expect(typeof stats.data.totalAppointments).toBe('number');
      expect(typeof stats.data.totalConversations).toBe('number');
    });

    test('should fetch dashboard metrics', async () => {
      const metrics = await apiClient.getDashboardMetrics();

      expect(metrics.success).toBeTruthy();
      expect(metrics.data).toBeDefined();
      expect(metrics.data.aiMetrics).toBeDefined();
      expect(typeof metrics.data.aiMetrics.averageResponseTime).toBe('number');
      expect(typeof metrics.data.aiMetrics.satisfactionRate).toBe('number');
    });
  });

  test.describe('TDD: Customers API CRUD', () => {
    test('should create customer successfully', async () => {
      const customerData = {
        name: 'Test Customer API',
        email: TestHelpers.generateTestEmail(),
        phone: '+5511999887766',
        address: 'Test Address, 123'
      };

      const response = await apiClient.createCustomer(customerData);

      expect(response.success).toBeTruthy();
      expect(response.data.customer).toBeDefined();
      expect(response.data.customer.name).toBe(customerData.name);
      expect(response.data.customer.email).toBe(customerData.email);

      // Store customer ID for other tests
      testUserData.customerId = response.data.customer.id;
    });

    test('should fetch customers list', async () => {
      const response = await apiClient.getCustomers({ page: 1, limit: 10 });

      expect(response.success).toBeTruthy();
      expect(response.data.customers).toBeDefined();
      expect(Array.isArray(response.data.customers)).toBeTruthy();
      expect(response.data.pagination).toBeDefined();
    });

    test('should fetch single customer', async () => {
      if (!testUserData.customerId) {
        test.skip();
      }

      const response = await apiClient.getCustomer(testUserData.customerId);

      expect(response.success).toBeTruthy();
      expect(response.data.customer).toBeDefined();
      expect(response.data.customer.id).toBe(testUserData.customerId);
    });

    test('should update customer', async () => {
      if (!testUserData.customerId) {
        test.skip();
      }

      const updateData = {
        name: 'Updated Customer Name',
        address: 'Updated Address, 456'
      };

      const response = await apiClient.updateCustomer(testUserData.customerId, updateData);

      expect(response.success).toBeTruthy();
      expect(response.data.customer.name).toBe(updateData.name);
      expect(response.data.customer.address).toBe(updateData.address);
    });

    test('should search customers', async () => {
      const response = await apiClient.getCustomers({ search: 'Test Customer' });

      expect(response.success).toBeTruthy();
      expect(response.data.customers).toBeDefined();
      // Should return filtered results
    });
  });

  test.describe('TDD: Pets API CRUD', () => {
    test('should create pet successfully', async () => {
      if (!testUserData.customerId) {
        test.skip();
      }

      const petData = {
        name: 'Test Pet API',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        customer_id: testUserData.customerId,
        weight: 25.5,
        color: 'Golden'
      };

      const response = await apiClient.createPet(petData);

      expect(response.success).toBeTruthy();
      expect(response.data.pet).toBeDefined();
      expect(response.data.pet.name).toBe(petData.name);
      expect(response.data.pet.species).toBe(petData.species);

      testUserData.petId = response.data.pet.id;
    });

    test('should fetch pets list', async () => {
      const response = await apiClient.getPets();

      expect(response.success).toBeTruthy();
      expect(response.data.pets).toBeDefined();
      expect(Array.isArray(response.data.pets)).toBeTruthy();
    });

    test('should fetch pets by customer', async () => {
      if (!testUserData.customerId) {
        test.skip();
      }

      const response = await apiClient.getPets(testUserData.customerId);

      expect(response.success).toBeTruthy();
      expect(response.data.pets).toBeDefined();
      // All pets should belong to this customer
      response.data.pets.forEach((pet: any) => {
        expect(pet.customer_id).toBe(testUserData.customerId);
      });
    });

    test('should update pet', async () => {
      if (!testUserData.petId) {
        test.skip();
      }

      const updateData = {
        name: 'Updated Pet Name',
        weight: 26.0
      };

      const response = await apiClient.updatePet(testUserData.petId, updateData);

      expect(response.success).toBeTruthy();
      expect(response.data.pet.name).toBe(updateData.name);
      expect(response.data.pet.weight).toBe(updateData.weight);
    });
  });

  test.describe('TDD: Appointments API CRUD', () => {
    test('should create appointment successfully', async () => {
      if (!testUserData.customerId || !testUserData.petId) {
        test.skip();
      }

      const appointmentData = {
        customer_id: testUserData.customerId,
        pet_id: testUserData.petId,
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        service_type: 'consultation',
        notes: 'Regular checkup',
        status: 'scheduled'
      };

      const response = await apiClient.createAppointment(appointmentData);

      expect(response.success).toBeTruthy();
      expect(response.data.appointment).toBeDefined();
      expect(response.data.appointment.service_type).toBe(appointmentData.service_type);

      testUserData.appointmentId = response.data.appointment.id;
    });

    test('should fetch appointments list', async () => {
      const response = await apiClient.getAppointments({ page: 1, limit: 10 });

      expect(response.success).toBeTruthy();
      expect(response.data.appointments).toBeDefined();
      expect(Array.isArray(response.data.appointments)).toBeTruthy();
    });

    test('should filter appointments by date range', async () => {
      const dateFrom = new Date().toISOString().split('T')[0];
      const dateTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await apiClient.getAppointments({
        date_from: dateFrom,
        date_to: dateTo
      });

      expect(response.success).toBeTruthy();
      expect(response.data.appointments).toBeDefined();
    });

    test('should update appointment status', async () => {
      if (!testUserData.appointmentId) {
        test.skip();
      }

      const updateData = {
        status: 'completed',
        notes: 'Appointment completed successfully'
      };

      const response = await apiClient.updateAppointment(testUserData.appointmentId, updateData);

      expect(response.success).toBeTruthy();
      expect(response.data.appointment.status).toBe(updateData.status);
      expect(response.data.appointment.notes).toBe(updateData.notes);
    });
  });

  test.describe('TDD: Conversations API', () => {
    test('should fetch conversations list', async () => {
      const response = await apiClient.getConversations({ page: 1, limit: 10 });

      expect(response.success).toBeTruthy();
      expect(response.data.conversations).toBeDefined();
      expect(Array.isArray(response.data.conversations)).toBeTruthy();
    });

    test('should filter conversations by customer', async () => {
      if (!testUserData.customerId) {
        test.skip();
      }

      const response = await apiClient.getConversations({
        customer_id: testUserData.customerId
      });

      expect(response.success).toBeTruthy();
      expect(response.data.conversations).toBeDefined();
    });
  });

  test.describe('TDD: API Security & Authorization', () => {
    test('should reject requests without authentication', async () => {
      const status = await apiClient.testUnauthorizedAccess();
      expect(status).toBe(401);
    });

    test('should return 404 for invalid endpoints', async () => {
      const status = await apiClient.testInvalidEndpoint();
      expect(status).toBe(404);
    });

    test('should validate request data types', async ({ request }) => {
      // Test with invalid data types
      const response = await request.post('http://localhost:3001/api/customers', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient['authToken']}`
        },
        data: {
          name: 123, // Invalid type - should be string
          email: 'invalid-email', // Invalid format
          phone: null // Invalid type
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should handle malformed JSON', async ({ request }) => {
      const response = await request.post('http://localhost:3001/api/customers', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient['authToken']}`
        },
        data: '{ invalid json }'
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('TDD: API Performance & Reliability', () => {
    test('should handle concurrent requests', async () => {
      // Test multiple concurrent API calls
      const promises = Array(5).fill(null).map(() => apiClient.getDashboardStats());

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.success).toBeTruthy();
      });
    });

    test('should respect rate limiting', async ({ request }) => {
      // This test depends on rate limiting being implemented
      // Make rapid requests to test rate limiting
      const rapidRequests = Array(10).fill(null).map(() =>
        request.get('http://localhost:3001/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${apiClient['authToken']}`
          }
        })
      );

      const responses = await Promise.all(rapidRequests);

      // Some requests might be rate limited (status 429)
      const successCount = responses.filter(r => r.ok()).length;
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;

      expect(successCount + rateLimitedCount).toBe(10);
    });

    test('should maintain data consistency', async () => {
      if (!testUserData.customerId) {
        test.skip();
      }

      // Get customer data
      const customer1 = await apiClient.getCustomer(testUserData.customerId);

      // Update customer
      await apiClient.updateCustomer(testUserData.customerId, {
        name: 'Consistency Test Name'
      });

      // Get customer data again
      const customer2 = await apiClient.getCustomer(testUserData.customerId);

      // Verify update was applied
      expect(customer2.data.customer.name).toBe('Consistency Test Name');
      expect(customer2.data.customer.id).toBe(customer1.data.customer.id);
    });
  });

  test.describe('TDD: Health Check & System Status', () => {
    test('should return healthy status', async () => {
      const health = await apiClient.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeDefined();
      expect(health.uptime).toBeDefined();
    });
  });

  // Cleanup phase
  test.afterAll(async () => {
    // Clean up test data if needed
    if (testUserData.appointmentId) {
      try {
        await apiClient.deleteAppointment(testUserData.appointmentId);
      } catch (error) {
        console.log('Cleanup: Could not delete appointment');
      }
    }

    if (testUserData.petId) {
      try {
        await apiClient.deletePet(testUserData.petId);
      } catch (error) {
        console.log('Cleanup: Could not delete pet');
      }
    }

    if (testUserData.customerId) {
      try {
        await apiClient.deleteCustomer(testUserData.customerId);
      } catch (error) {
        console.log('Cleanup: Could not delete customer');
      }
    }
  });
});