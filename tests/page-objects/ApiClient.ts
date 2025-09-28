import { APIRequestContext, expect } from '@playwright/test';

export class ApiClient {
  private baseURL: string;
  private authToken?: string;

  constructor(private request: APIRequestContext) {
    this.baseURL = 'http://localhost:3001';
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Authentication APIs
   */
  async signup(data: {
    email: string;
    password: string;
    fullName: string;
    organizationName: string;
    subscriptionTier: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/auth/signup`, {
      headers: this.getHeaders(),
      data
    });

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();

    if (responseData.success && responseData.data?.tokens?.accessToken) {
      this.setAuthToken(responseData.data.tokens.accessToken);
    }

    return responseData;
  }

  async login(email: string, password: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/login`, {
      headers: this.getHeaders(),
      data: { email, password }
    });

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();

    if (responseData.success && responseData.data?.tokens?.accessToken) {
      this.setAuthToken(responseData.data.tokens.accessToken);
    }

    return responseData;
  }

  /**
   * Dashboard APIs
   */
  async getDashboardStats() {
    const response = await this.request.get(`${this.baseURL}/api/dashboard/stats`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getDashboardMetrics() {
    const response = await this.request.get(`${this.baseURL}/api/dashboard/metrics`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Customers APIs
   */
  async getCustomers(params?: { page?: number; limit?: number; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);

    const response = await this.request.get(`${this.baseURL}/api/customers?${searchParams}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/customers`, {
      headers: this.getHeaders(),
      data
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getCustomer(id: string) {
    const response = await this.request.get(`${this.baseURL}/api/customers/${id}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async updateCustomer(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
  }>) {
    const response = await this.request.put(`${this.baseURL}/api/customers/${id}`, {
      headers: this.getHeaders(),
      data
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async deleteCustomer(id: string) {
    const response = await this.request.delete(`${this.baseURL}/api/customers/${id}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Pets APIs
   */
  async getPets(customerId?: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (customerId) searchParams.set('customer_id', customerId);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await this.request.get(`${this.baseURL}/api/pets?${searchParams}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async createPet(data: {
    name: string;
    species: string;
    breed?: string;
    age?: number;
    customer_id: string;
    weight?: number;
    color?: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/pets`, {
      headers: this.getHeaders(),
      data
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getPet(id: string) {
    const response = await this.request.get(`${this.baseURL}/api/pets/${id}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async updatePet(id: string, data: Partial<{
    name: string;
    species: string;
    breed: string;
    age: number;
    weight: number;
    color: string;
  }>) {
    const response = await this.request.put(`${this.baseURL}/api/pets/${id}`, {
      headers: this.getHeaders(),
      data
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async deletePet(id: string) {
    const response = await this.request.delete(`${this.baseURL}/api/pets/${id}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Appointments APIs
   */
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    customer_id?: string;
    pet_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.customer_id) searchParams.set('customer_id', params.customer_id);
    if (params?.pet_id) searchParams.set('pet_id', params.pet_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);

    const response = await this.request.get(`${this.baseURL}/api/appointments?${searchParams}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async createAppointment(data: {
    customer_id: string;
    pet_id: string;
    appointment_date: string;
    service_type: string;
    notes?: string;
    status?: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/appointments`, {
      headers: this.getHeaders(),
      data
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getAppointment(id: string) {
    const response = await this.request.get(`${this.baseURL}/api/appointments/${id}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async updateAppointment(id: string, data: Partial<{
    appointment_date: string;
    service_type: string;
    notes: string;
    status: string;
  }>) {
    const response = await this.request.put(`${this.baseURL}/api/appointments/${id}`, {
      headers: this.getHeaders(),
      data
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async deleteAppointment(id: string) {
    const response = await this.request.delete(`${this.baseURL}/api/appointments/${id}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Conversations APIs
   */
  async getConversations(params?: { page?: number; limit?: number; customer_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.customer_id) searchParams.set('customer_id', params.customer_id);

    const response = await this.request.get(`${this.baseURL}/api/conversations?${searchParams}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getConversation(id: string) {
    const response = await this.request.get(`${this.baseURL}/api/conversations/${id}`, {
      headers: this.getHeaders()
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await this.request.get(`${this.baseURL}/health`);
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Test API authorization
   */
  async testUnauthorizedAccess() {
    const originalToken = this.authToken;
    this.authToken = undefined;

    const response = await this.request.get(`${this.baseURL}/api/customers`, {
      headers: this.getHeaders()
    });

    expect(response.status()).toBe(401);

    this.authToken = originalToken;
    return response.status();
  }

  /**
   * Test invalid endpoints
   */
  async testInvalidEndpoint() {
    const response = await this.request.get(`${this.baseURL}/api/invalid-endpoint`, {
      headers: this.getHeaders()
    });

    expect(response.status()).toBe(404);
    return response.status();
  }
}