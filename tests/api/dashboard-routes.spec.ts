import { test, expect } from '@playwright/test';

const API_URL = 'https://auzap-backend-py0l.onrender.com';

test.describe('Dashboard API Routes', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'cafofopet@aizuap.ai.br04',
        password: 'CafofoPet@2024#Secure'
      }
    });

    if (loginResponse.ok()) {
      const data = await loginResponse.json();
      authToken = data.token || data.access_token;
    }
  });

  test('GET /api/dashboard/stats should return stats', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Status:', response.status());
    console.log('Response:', await response.text());

    expect(response.ok()).toBeTruthy();
  });

  test('GET /api/dashboard/overview should return overview', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/dashboard/overview`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Status:', response.status());
    console.log('Response:', await response.text());

    expect(response.ok()).toBeTruthy();
  });

  test('GET /api/dashboard/analytics/revenue should return revenue', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/dashboard/analytics/revenue`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Status:', response.status());
    console.log('Response:', await response.text());

    expect(response.ok()).toBeTruthy();
  });

  test('GET /api/dashboard/performance should return metrics', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/dashboard/performance`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Status:', response.status());
    console.log('Response:', await response.text());

    expect(response.ok()).toBeTruthy();
  });
});
