import { http, HttpResponse } from 'msw';

// Mock data
const mockCatalogItems = [
  {
    id: '1',
    name: 'Banho e Tosa Completo',
    description: 'Banho completo com shampoo especial, condicionador, secagem e tosa higiênica',
    category: 'Serviços',
    price: 80.0,
    duration_minutes: 90,
    requires_appointment: true,
    tags: ['banho', 'tosa', 'higiene'],
    image_url: '',
    is_active: true,
    organization_id: 'test-org-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    type: 'service' as const,
    popular: true,
    status: 'active' as const,
    bookings: 45,
  },
  {
    id: '2',
    name: 'Ração Premium Golden',
    description: 'Ração super premium para cães adultos - 15kg',
    category: 'Produtos',
    price: 89.9,
    duration_minutes: undefined,
    requires_appointment: false,
    tags: ['ração', 'premium', 'adulto'],
    image_url: '',
    is_active: true,
    organization_id: 'test-org-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    type: 'product' as const,
    popular: false,
    status: 'active' as const,
    stock: 25,
    sales: 18,
  },
  {
    id: '3',
    name: 'Consulta Veterinária',
    description: 'Consulta completa com exame físico e orientações',
    category: 'Serviços',
    price: 120.0,
    duration_minutes: 45,
    requires_appointment: true,
    tags: ['consulta', 'veterinário', 'exame'],
    image_url: '',
    is_active: true,
    organization_id: 'test-org-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    type: 'service' as const,
    popular: true,
    status: 'active' as const,
    bookings: 32,
  },
];

const mockCategories = [
  { name: 'Serviços', count: 2, slug: 'servicos' },
  { name: 'Produtos', count: 1, slug: 'produtos' },
];

const mockStats = {
  total_items: 3,
  active_items: 3,
  inactive_items: 0,
  categories_count: 2,
  average_price: 96.63,
  appointment_required_items: 2,
  price_range: {
    min: 80.0,
    max: 120.0,
  },
};

export const catalogHandlers = [
  // GET /api/catalog - List catalog items
  http.get('*/api/catalog', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const category = url.searchParams.get('category');
    const isActive = url.searchParams.get('is_active');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filteredItems = [...mockCatalogItems];

    // Apply search filter
    if (search) {
      filteredItems = filteredItems.filter(
        item =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    // Apply active status filter
    if (isActive && isActive !== 'all') {
      filteredItems = filteredItems.filter(item => item.is_active === (isActive === 'true'));
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: paginatedItems,
      message: 'Catalog items retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / limit),
      },
    });
  }),

  // POST /api/catalog - Create new catalog item
  http.post('*/api/catalog', async ({ request }) => {
    const newItem = await request.json() as any;
    const createdItem = {
      ...newItem,
      id: Date.now().toString(),
      organization_id: 'test-org-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: newItem.is_active !== false,
    };

    mockCatalogItems.push(createdItem);

    return HttpResponse.json({
      success: true,
      data: createdItem,
      message: 'Item do catálogo criado com sucesso',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // GET /api/catalog/:id - Get catalog item details
  http.get('*/api/catalog/:id', ({ params }) => {
    const { id } = params;
    const item = mockCatalogItems.find(item => item.id === id);

    if (!item) {
      return HttpResponse.json({
        success: false,
        message: 'Item do catálogo não encontrado',
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    return HttpResponse.json({
      success: true,
      data: item,
      message: 'Catalog item details retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // PUT /api/catalog/:id - Update catalog item
  http.put('*/api/catalog/:id', async ({ params, request }) => {
    const { id } = params;
    const updates = await request.json() as any;
    const itemIndex = mockCatalogItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return HttpResponse.json({
        success: false,
        message: 'Item do catálogo não encontrado',
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    const updatedItem = {
      ...mockCatalogItems[itemIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    mockCatalogItems[itemIndex] = updatedItem;

    return HttpResponse.json({
      success: true,
      data: updatedItem,
      message: 'Item do catálogo atualizado com sucesso',
      timestamp: new Date().toISOString(),
    });
  }),

  // DELETE /api/catalog/:id - Soft delete catalog item
  http.delete('*/api/catalog/:id', ({ params }) => {
    const { id } = params;
    const itemIndex = mockCatalogItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return HttpResponse.json({
        success: false,
        message: 'Item do catálogo não encontrado',
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    const updatedItem = {
      ...mockCatalogItems[itemIndex],
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    mockCatalogItems[itemIndex] = updatedItem;

    return HttpResponse.json({
      success: true,
      data: updatedItem,
      message: 'Item do catálogo desativado com sucesso',
      timestamp: new Date().toISOString(),
    });
  }),

  // POST /api/catalog/:id/image - Upload item image
  http.post('*/api/catalog/:id/image', async ({ params, request }) => {
    const { id } = params;
    const { image_url } = await request.json() as any;
    const itemIndex = mockCatalogItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return HttpResponse.json({
        success: false,
        message: 'Item do catálogo não encontrado',
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    const updatedItem = {
      ...mockCatalogItems[itemIndex],
      image_url,
      updated_at: new Date().toISOString(),
    };

    mockCatalogItems[itemIndex] = updatedItem;

    return HttpResponse.json({
      success: true,
      data: updatedItem,
      message: 'Imagem do item atualizada com sucesso',
      timestamp: new Date().toISOString(),
    });
  }),

  // GET /api/catalog/categories/list - Get all categories
  http.get('*/api/catalog/categories/list', () => {
    return HttpResponse.json({
      success: true,
      data: mockCategories,
      message: 'Categories retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // GET /api/catalog/stats/overview - Get catalog statistics
  http.get('*/api/catalog/stats/overview', () => {
    return HttpResponse.json({
      success: true,
      data: mockStats,
      message: 'Catalog statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // GET /api/catalog/popular/items - Get popular items
  http.get('*/api/catalog/popular/items', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const popularItems = mockCatalogItems
      .filter(item => item.popular)
      .slice(0, limit);

    return HttpResponse.json({
      success: true,
      data: popularItems,
      message: 'Popular items retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // GET /api/catalog/recommendations/:customer_id - Get recommended items
  http.get('*/api/catalog/recommendations/:customer_id', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');

    const recommendations = mockCatalogItems.slice(0, limit);

    return HttpResponse.json({
      success: true,
      data: recommendations,
      message: 'Recommendations retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),
];