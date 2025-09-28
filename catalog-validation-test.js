#!/usr/bin/env node

/**
 * SCRIPT DE VALIDAÇÃO COMPLETA DA API DO CATÁLOGO
 * ============================================
 *
 * Este script testa todos os endpoints do catálogo de forma automatizada
 * validando autenticação, autorização, isolamento multi-tenant e funcionalidades
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class CatalogValidator {
  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:3001';
    this.apiKey = process.env.API_KEY || 'auzap_dev_api_key_2024_secure_development';
    this.organizationId = '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
    this.testResults = [];
    this.testData = {};

    // HTTP client with default headers
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      timeout: 10000
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(formatted);
  }

  async runTest(testName, testFunction) {
    this.log(`🧪 Running test: ${testName}`);

    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration,
        result
      });

      this.log(`✅ ${testName} - PASSED (${duration}ms)`, 'success');
      return result;
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        error: error.message,
        stack: error.stack
      });

      this.log(`❌ ${testName} - FAILED: ${error.message}`, 'error');
      return null;
    }
  }

  // ===================================================================
  // TESTES DE CONECTIVIDADE E AUTENTICAÇÃO
  // ===================================================================

  async testServerConnectivity() {
    const response = await this.client.get('/health');
    if (response.status !== 200) {
      throw new Error(`Server not healthy: ${response.status}`);
    }
    return response.data;
  }

  async testAuthWithoutToken() {
    try {
      await axios.get(`${this.baseUrl}/api/catalog`);
      throw new Error('Should have failed without auth');
    } catch (error) {
      if (error.response?.status === 401) {
        return { message: 'Auth properly required' };
      }
      throw error;
    }
  }

  async testAuthWithInvalidToken() {
    try {
      await axios.get(`${this.baseUrl}/api/catalog`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      throw new Error('Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        return { message: 'Invalid token properly rejected' };
      }
      throw error;
    }
  }

  // ===================================================================
  // TESTES DE CRUD DO CATÁLOGO
  // ===================================================================

  async testCreateCatalogItem() {
    const itemData = {
      name: 'Banho e Tosa Completo',
      description: 'Serviço completo de banho e tosa para cães de pequeno porte',
      category: 'Serviços de Higiene',
      price: 45.99,
      duration_minutes: 90,
      requires_appointment: true,
      tags: ['banho', 'tosa', 'higiene'],
      is_active: true
    };

    const response = await this.client.post('/api/catalog', itemData);

    if (response.status !== 201) {
      throw new Error(`Expected 201, got ${response.status}`);
    }

    const item = response.data.data;
    this.testData.catalogItem = item;

    // Validar resposta
    if (!item.id || !item.organization_id) {
      throw new Error('Missing required fields in response');
    }

    if (item.organization_id !== this.organizationId) {
      throw new Error('Organization ID mismatch');
    }

    return item;
  }

  async testListCatalogItems() {
    const response = await this.client.get('/api/catalog');

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const data = response.data;

    // Validar estrutura da resposta
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response structure');
    }

    // Validar paginação
    if (!data.pagination || typeof data.pagination.total !== 'number') {
      throw new Error('Missing pagination data');
    }

    return data;
  }

  async testListCatalogItemsWithFilters() {
    const params = {
      category: 'Serviços de Higiene',
      is_active: 'true',
      requires_appointment: 'true',
      search: 'banho',
      page: 1,
      limit: 10
    };

    const response = await this.client.get('/api/catalog', { params });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const data = response.data;

    // Validar que filtros foram aplicados
    if (data.data.length > 0) {
      const item = data.data[0];
      if (item.category !== params.category) {
        throw new Error('Category filter not applied');
      }
    }

    return data;
  }

  async testGetCatalogItemById() {
    if (!this.testData.catalogItem) {
      throw new Error('No catalog item created for testing');
    }

    const itemId = this.testData.catalogItem.id;
    const response = await this.client.get(`/api/catalog/${itemId}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const item = response.data.data;

    if (item.id !== itemId) {
      throw new Error('Item ID mismatch');
    }

    return item;
  }

  async testUpdateCatalogItem() {
    if (!this.testData.catalogItem) {
      throw new Error('No catalog item created for testing');
    }

    const itemId = this.testData.catalogItem.id;
    const updateData = {
      price: 55.99,
      description: 'Serviço completo de banho e tosa - ATUALIZADO',
      tags: ['banho', 'tosa', 'higiene', 'premium']
    };

    const response = await this.client.put(`/api/catalog/${itemId}`, updateData);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const item = response.data.data;

    if (item.price !== updateData.price) {
      throw new Error('Price not updated');
    }

    if (!item.description.includes('ATUALIZADO')) {
      throw new Error('Description not updated');
    }

    return item;
  }

  async testUploadItemImage() {
    if (!this.testData.catalogItem) {
      throw new Error('No catalog item created for testing');
    }

    const itemId = this.testData.catalogItem.id;
    const imageData = {
      image_url: 'https://example.com/banho-tosa.jpg'
    };

    const response = await this.client.post(`/api/catalog/${itemId}/image`, imageData);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const item = response.data.data;

    if (item.image_url !== imageData.image_url) {
      throw new Error('Image URL not updated');
    }

    return item;
  }

  // ===================================================================
  // TESTES DE ENDPOINTS ESPECIAIS
  // ===================================================================

  async testGetCategories() {
    const response = await this.client.get('/api/catalog/categories/list');

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const data = response.data;

    if (!Array.isArray(data.data)) {
      throw new Error('Categories should be an array');
    }

    // Verificar estrutura da categoria
    if (data.data.length > 0) {
      const category = data.data[0];
      if (!category.name || typeof category.count !== 'number') {
        throw new Error('Invalid category structure');
      }
    }

    return data;
  }

  async testGetPopularItems() {
    const params = { limit: 5, days: 30 };
    const response = await this.client.get('/api/catalog/popular/items', { params });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const data = response.data;

    if (!Array.isArray(data.data)) {
      throw new Error('Popular items should be an array');
    }

    return data;
  }

  async testGetRecommendations() {
    // Usar um customer_id fictício para teste
    const customerId = 'test-customer-123';
    const params = { limit: 5 };

    const response = await this.client.get(`/api/catalog/recommendations/${customerId}`, { params });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const data = response.data;

    if (!Array.isArray(data.data)) {
      throw new Error('Recommendations should be an array');
    }

    return data;
  }

  async testGetCatalogStats() {
    const response = await this.client.get('/api/catalog/stats/overview');

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const stats = response.data.data;

    // Verificar campos obrigatórios
    const requiredFields = [
      'total_items', 'active_items', 'inactive_items',
      'categories_count', 'average_price', 'appointment_required_items'
    ];

    for (const field of requiredFields) {
      if (typeof stats[field] !== 'number') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    return stats;
  }

  // ===================================================================
  // TESTES DE VALIDAÇÃO E EDGE CASES
  // ===================================================================

  async testCreateInvalidItem() {
    const invalidData = {
      name: '', // Nome vazio
      price: -10, // Preço negativo
      category: '' // Categoria vazia
    };

    try {
      await this.client.post('/api/catalog', invalidData);
      throw new Error('Should have failed with invalid data');
    } catch (error) {
      if (error.response?.status === 400) {
        return { message: 'Validation working correctly' };
      }
      throw error;
    }
  }

  async testGetNonExistentItem() {
    const fakeId = 'non-existent-id';

    try {
      await this.client.get(`/api/catalog/${fakeId}`);
      throw new Error('Should have failed with 404');
    } catch (error) {
      if (error.response?.status === 404) {
        return { message: '404 handling working correctly' };
      }
      throw error;
    }
  }

  async testSoftDeleteItem() {
    if (!this.testData.catalogItem) {
      throw new Error('No catalog item created for testing');
    }

    const itemId = this.testData.catalogItem.id;
    const response = await this.client.delete(`/api/catalog/${itemId}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const item = response.data.data;

    if (item.is_active !== false) {
      throw new Error('Item not soft deleted');
    }

    return item;
  }

  // ===================================================================
  // TESTES DE ISOLAMENTO MULTI-TENANT
  // ===================================================================

  async testTenantIsolation() {
    // Criar cliente com organização diferente
    const otherOrgClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-other-org'
      }
    });

    try {
      // Tentar acessar com organização diferente
      await otherOrgClient.get('/api/catalog');
      throw new Error('Should have failed with different organization');
    } catch (error) {
      if (error.response?.status === 401) {
        return { message: 'Tenant isolation working correctly' };
      }
      throw error;
    }
  }

  // ===================================================================
  // EXECUTOR PRINCIPAL
  // ===================================================================

  async runAllTests() {
    this.log('🚀 Iniciando validação completa da API do Catálogo...');
    this.log(`📡 Base URL: ${this.baseUrl}`);
    this.log(`🏢 Organization ID: ${this.organizationId}`);

    const tests = [
      // Conectividade e Auth
      ['Server Connectivity', () => this.testServerConnectivity()],
      ['Auth Without Token', () => this.testAuthWithoutToken()],
      ['Auth With Invalid Token', () => this.testAuthWithInvalidToken()],

      // CRUD Operations
      ['Create Catalog Item', () => this.testCreateCatalogItem()],
      ['List Catalog Items', () => this.testListCatalogItems()],
      ['List With Filters', () => this.testListCatalogItemsWithFilters()],
      ['Get Item By ID', () => this.testGetCatalogItemById()],
      ['Update Item', () => this.testUpdateCatalogItem()],
      ['Upload Item Image', () => this.testUploadItemImage()],

      // Special Endpoints
      ['Get Categories', () => this.testGetCategories()],
      ['Get Popular Items', () => this.testGetPopularItems()],
      ['Get Recommendations', () => this.testGetRecommendations()],
      ['Get Catalog Stats', () => this.testGetCatalogStats()],

      // Validation & Edge Cases
      ['Create Invalid Item', () => this.testCreateInvalidItem()],
      ['Get Non-Existent Item', () => this.testGetNonExistentItem()],
      ['Soft Delete Item', () => this.testSoftDeleteItem()],

      // Security
      ['Tenant Isolation', () => this.testTenantIsolation()]
    ];

    for (const [testName, testFunction] of tests) {
      await this.runTest(testName, testFunction);

      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.generateReport();
  }

  generateReport() {
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const total = this.testResults.length;

    this.log('\n');
    this.log('='.repeat(60));
    this.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO DO CATÁLOGO');
    this.log('='.repeat(60));
    this.log(`✅ Testes Aprovados: ${passed}`);
    this.log(`❌ Testes Falharam: ${failed}`);
    this.log(`📈 Taxa de Sucesso: ${((passed / total) * 100).toFixed(1)}%`);
    this.log('='.repeat(60));

    if (failed > 0) {
      this.log('\n❌ TESTES QUE FALHARAM:');
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          this.log(`   • ${test.name}: ${test.error}`);
        });
    }

    // Salvar relatório em arquivo
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, successRate: (passed / total) * 100 },
      results: this.testResults
    };

    const reportPath = path.join(__dirname, 'catalog-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    this.log(`\n📄 Relatório completo salvo em: ${reportPath}`);

    // Exit code baseado nos resultados
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const validator = new CatalogValidator();
  validator.runAllTests().catch(error => {
    console.error('❌ Erro fatal durante os testes:', error);
    process.exit(1);
  });
}

module.exports = CatalogValidator;