# Análise Completa da Arquitetura Frontend - Aupet AI Connect

## 📁 Estrutura de Arquivos Principal

```
frontend/src/
├── App.tsx                     # Router principal e providers
├── main.tsx                    # Entry point
├── components/                 # Componentes reutilizáveis
│   ├── auth/                  # Autenticação
│   ├── dashboard/             # Dashboard específicos
│   ├── layout/                # Layout (navbar, sidebar)
│   └── ui/                    # Componentes base (shadcn/ui)
├── contexts/                   # Context API
│   └── AuthContext.tsx        # Autenticação global
├── hooks/                     # Custom hooks
├── integrations/              # Integrações externas
│   └── supabase/              # Cliente e tipos Supabase
├── pages/                     # Páginas da aplicação
└── test/                      # Configurações de teste
```

## 🏗️ Componentes Principais e Funcionalidades

### 1. **Páginas Principais** (`/src/pages/`)

#### **Index.tsx** - Dashboard Principal
- **Função**: Central de comando com visão geral
- **Dados consumidos**:
  - Dashboard stats (conversas, agendamentos, receita)
  - Real-time data via WebSocket
- **APIs**: `useDashboardStats(organizationId)`
- **Componentes**: StatsOverview, RecentConversations, AIPerformance
- **Estado**: Real-time subscriptions para updates automáticos

#### **Conversations.tsx** - Gestão de Conversas WhatsApp
- **Função**: Interface de chat em tempo real
- **Dados consumidos**:
  - Lista de conversas ativas
  - Mensagens por conversa
  - Contatos e pets associados
- **APIs**: `useConversations`, `useMessageRealTime`
- **Funcionalidades**:
  - Chat interface completa
  - Filtros avançados (status, busca, favoritos)
  - Ações: editar, escalar, arquivar
  - Real-time message updates

#### **Customers.tsx** - Gestão de Clientes
- **Função**: CRUD completo de clientes (famílias pet)
- **Dados consumidos**:
  - Lista de clientes com pets associados
  - Histórico de agendamentos
  - Estatísticas de gastos
- **APIs**: `useCustomers`, `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer`
- **Funcionalidades**:
  - Filtros por status, data, valor gasto
  - Visualizações: grid/table
  - Modal para criação/edição

#### **Pets.tsx** - Gestão de Pets
- **Função**: Prontuário médico e cadastro de pets
- **Dados consumidos**:
  - Lista de pets com donos
  - Informações médicas (vacinação, alergias)
  - Histórico de consultas
- **APIs**: `usePets`, `useCreatePet`, `useUpdatePet`
- **Funcionalidades**:
  - Upload de fotos
  - Prontuário médico completo
  - Lembretes de vacinação

#### **Appointments.tsx** - Agendamentos
- **Função**: Sistema completo de agendamentos
- **Dados consumidos**:
  - Agendamentos por data/status
  - Clientes e pets para seleção
  - Tipos de serviços disponíveis
- **APIs**: `useAppointments`, `useCreateAppointment`, `useUpdateAppointment`
- **Funcionalidades**:
  - Calendário visual
  - Auto-preenchimento de preços
  - Múltiplas visualizações (lista/calendário)

#### **Catalog.tsx** - Catálogo de Produtos/Serviços
- **Função**: Gestão de produtos e serviços
- **Dados consumidos**:
  - Lista de itens com categorias
  - Estatísticas de vendas
  - Filtros por categoria/status/preço
- **APIs**: `useCatalogItems`, `useCatalogStats`, `useCatalogCategories`
- **Funcionalidades**:
  - Gestão de favoritos
  - Ordenação avançada
  - CRUD completo

#### **AIConfig.tsx** - Configuração da IA
- **Função**: Personalização do assistente virtual
- **Dados consumidos**: Configurações de personalidade, comportamento
- **Funcionalidades**:
  - Configuração de personalidade
  - Palavras-chave de escalação
  - Preview de conversas
  - Testes de IA

#### **Analytics.tsx** - Relatórios e Métricas
- **Função**: Dashboard analytics com gráficos
- **Dados consumidos**: Métricas históricas e atuais
- **Funcionalidades**:
  - Gráficos de receita, agendamentos
  - Filtros por período
  - Exportação de relatórios

#### **Settings.tsx** - Configurações do Sistema
- **Função**: Configurações gerais da organização
- **Dados consumidos**: Configurações da organização
- **APIs**: `useOrganizationSettings`, `useUpdateOrganizationSettings`
- **Funcionalidades**:
  - Abas: Negócio, WhatsApp, IA, Notificações, Segurança
  - Auto-save com validação

#### **Login.tsx** - Autenticação
- **Função**: Login com validação
- **APIs**: `signIn` do AuthContext
- **Funcionalidades**:
  - Validação de formulário
  - Login rápido para desenvolvimento
  - Redirecionamento automático

### 2. **Sistema de Hooks** (`/src/hooks/`)

#### **useAuth.ts** - Autenticação Base
- **Função**: Interface com Supabase Auth
- **Retorna**: user, session, loading, signIn, signUp, signOut
- **Estado**: Gerencia sessão e usuário atual

#### **useApiData.ts** - API Principal (Backend)
- **Função**: Conexão com backend Node.js/Express
- **Features**:
  - Interceptors para auth automático
  - Tenant isolation (organization_id)
  - Error handling centralizado
  - Cache com React Query

#### **useSupabaseData.ts** - Dados Diretos Supabase
- **Função**: Queries diretas ao Supabase
- **Uso**: Fallback quando backend não disponível
- **Tabelas**: appointments, pets, whatsapp_contacts, etc.

#### **useRealTime.ts** - WebSocket/Real-time
- **Função**: Subscriptions em tempo real
- **Features**:
  - Auto-invalidação de queries
  - Notificações automáticas
  - Reconnection handling

#### **useNotifications.ts** - Sistema de Notificações
- **Função**: Gerencia notificações da aplicação
- **Features**: markAsRead, removeNotification, real-time updates

### 3. **Layout e Navegação** (`/src/components/layout/`)

#### **Navbar.tsx**
- **Função**: Barra superior com navegação global
- **Features**:
  - Profile dropdown
  - Notificações real-time
  - Status de conexão
  - Organization switcher

#### **Sidebar.tsx**
- **Função**: Menu lateral com navegação principal
- **Items**: Dashboard, Conversas, Clientes, Pets, Agendamentos, Catálogo, IA, Analytics, Settings
- **Features**: Active state, badges para notificações

### 4. **Context e Estado Global** (`/src/contexts/`)

#### **AuthContext.tsx**
- **Função**: Estado global de autenticação
- **Providers**: Supabase user, session, profile data
- **Auto-loading**: Profile e organization data

### 5. **Integração com Supabase** (`/src/integrations/supabase/`)

#### **client.ts**
- **Função**: Cliente Supabase configurado
- **Features**: Auto-refresh, localStorage, realtime

#### **types.ts**
- **Função**: Tipos TypeScript gerados do schema
- **Uso**: Type safety em toda aplicação

## 📊 Fluxo de Dados e APIs

### **Backend API (Primary)**
```
Base URL: process.env.VITE_API_URL || 'http://localhost:3001/api'

Endpoints Principais:
- GET /dashboard/stats           → Dashboard metrics
- GET /customers                 → Lista clientes
- POST /customers                → Criar cliente
- GET /pets                      → Lista pets
- GET /appointments              → Lista agendamentos
- GET /catalog                   → Lista produtos/serviços
- GET /conversations             → Lista conversas WhatsApp
- GET /settings                  → Configurações da org
```

### **Supabase (Secondary/Fallback)**
```
Tabelas Principais:
- whatsapp_contacts             → Clientes/contatos
- pets                          → Informações dos pets
- appointments                  → Agendamentos
- whatsapp_conversations        → Conversas
- whatsapp_messages             → Mensagens
- catalog_items                 → Produtos/serviços
- organization_settings         → Configurações
```

### **Real-time Data Flow**
```
1. Supabase Realtime → useRealTime hook
2. Query invalidation → React Query refetch
3. UI update → Notificação opcional
```

## 🎨 Padrões de Design e UX

### **Design System**
- **Base**: shadcn/ui components
- **Tema**: Pet-friendly com cores suaves (azul, rosa, roxo)
- **Gradient**: Extensivo uso de gradientes
- **Icons**: Lucide React
- **Animations**: Tailwind + custom CSS

### **Layout Patterns**
- **Dashboard**: Grid responsivo com cards
- **Forms**: Modal dialogs com validação
- **Lists**: Table/Grid com filtros avançados
- **Navigation**: Sidebar + breadcrumbs

### **UX Features**
- **Loading States**: Skeletons customizados
- **Empty States**: Ilustrações e CTAs
- **Error Handling**: Toasts e fallbacks
- **Responsive**: Mobile-first design

## 🔄 Estado e Performance

### **State Management**
- **Global**: React Context (Auth)
- **Server**: React Query (API data)
- **Local**: useState/useReducer
- **Forms**: Controlled components

### **Performance Optimizations**
- **Memoization**: useMemo para filtros complexos
- **Callbacks**: useCallback para handlers
- **Code Splitting**: Lazy loading (potencial)
- **Virtual Scrolling**: Para listas grandes (futuro)

### **Caching Strategy**
- **React Query**: 5min stale time para dados estáticos
- **Real-time**: 30s para dados dinâmicos
- **User Data**: Session storage

## 🔗 Relacionamentos Entre Componentes

### **Hierarquia de Dados**
```
Organization
├── Customers (whatsapp_contacts)
│   └── Pets
│       └── Appointments
├── Conversations
│   └── Messages
├── Catalog Items
└── Settings
```

### **Shared State**
- **organizationId**: Usado em todos os hooks de dados
- **user**: Context global via AuthProvider
- **notifications**: Global notification system
- **favoriteItems**: Local state per page

### **Component Communication**
- **Props**: Parent → Child data flow
- **Events**: Child → Parent via callbacks
- **Context**: Cross-component shared state
- **Query Invalidation**: Cross-page data sync

## 🚀 Padrões de Desenvolvimento

### **Component Structure**
1. **Imports**: Libraries → Local components → Hooks → Utils
2. **Types**: Local interfaces first
3. **State**: Grouped by feature
4. **Effects**: Dependencies explicitly listed
5. **Handlers**: useCallback for performance
6. **Render**: Early returns for loading/error

### **Error Handling**
- **API Errors**: Try/catch with toast notifications
- **Loading States**: Centralized skeleton components
- **Fallbacks**: Default values for missing data
- **Validation**: Form-level and field-level

### **Accessibility**
- **ARIA**: Labels and descriptions
- **Keyboard**: Tab navigation support
- **Focus**: Clear focus indicators
- **Screen Readers**: Semantic HTML

## 📱 Responsividade

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Layout Adaptations**
- **Sidebar**: Collapses to drawer on mobile
- **Tables**: Scroll horizontal on mobile
- **Forms**: Stack fields on small screens
- **Cards**: Responsive grid layout

## 🔮 Futuras Melhorias Identificadas

### **Performance**
- [ ] Implementar React.lazy para code splitting
- [ ] Virtual scrolling para listas grandes
- [ ] Service Worker para cache offline
- [ ] Bundle optimization

### **UX**
- [ ] Dark mode support
- [ ] Better mobile experience
- [ ] Keyboard shortcuts
- [ ] Advanced search

### **Features**
- [ ] Multi-language support
- [ ] Advanced filtering
- [ ] Bulk operations
- [ ] Export/Import data

---

**Resumo**: A arquitetura frontend está bem estruturada com separação clara de responsabilidades, uso adequado de React patterns modernos, e integração robusta com backend e Supabase. O sistema é altamente modular e preparado para escalar.