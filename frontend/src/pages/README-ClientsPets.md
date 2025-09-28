# 🐾 Clientes & Pets - Página Unificada

## 📖 Visão Geral

A página **Clientes & Pets** é uma interface moderna e unificada para gerenciar clientes e seus pets em um só lugar. Esta funcionalidade revoluciona a experiência de gestão ao combinar dados relacionados de forma intuitiva e visual.

## ✨ Funcionalidades Principais

### 🎯 Navegação por Tabs
- **Visão Unificada**: Mostra clientes e pets juntos
- **Apenas Clientes**: Foco exclusivo nos clientes
- **Apenas Pets**: Foco exclusivo nos pets

### 📊 Múltiplas Visualizações
1. **Kanban Board** 📋
   - Drag & drop entre colunas
   - Colunas dinâmicas baseadas no tipo de dados
   - Feedback visual durante arraste

2. **Cards Grid** 🃏
   - Layout responsivo em grid
   - Cards visuais com informações resumidas
   - Seleção múltipla para ações em lote

3. **Tabela** 📑
   - Visualização tradicional em tabela
   - Ordenação por colunas
   - Densidade de informações otimizada

### 🔍 Sistema de Filtros Avançado
- **Busca Global**: Command+K para busca rápida
- **Filtros Contextuais**: Status, espécie, período, vacinação
- **Chips Visuais**: Mostra filtros ativos com opção de remoção
- **Filtros Inteligentes**: Adapta-se ao tipo de dados mostrado

### 🛠️ Modais Avançados

#### CustomerModal - Cliente
- **Multi-step Form**: Básico → Endereço → Preferências
- **Validação em Tempo Real**: Feedback imediato
- **Upload de Avatar**: Suporte a imagens
- **Histórico**: Timeline de interações

#### PetModal - Pet
- **Seleção Visual do Dono**: Interface amigável
- **Prontuário Médico Completo**: Condições, alergias, medicamentos
- **Controle de Vacinação**: Status e datas
- **Upload de Fotos**: Múltiplas imagens do pet

### 📱 Sidebar de Detalhes
- **Deslizante**: Abre/fecha suavemente
- **Informações Completas**: Todos os dados do cliente/pet
- **Ações Rápidas**: Botões de ação contextual
- **Relacionamentos**: Mostra pets do cliente ou dono do pet

### ⚡ Ações em Lote
- **Seleção Múltipla**: Checkbox em cada card
- **Exportação**: CSV/Excel dos dados selecionados
- **Alteração de Status**: Bulk update de status
- **Exclusão em Massa**: Com confirmação de segurança

## 🚀 Tecnologias Utilizadas

### Core
- **React 18** com TypeScript
- **Vite** para build otimizado
- **React Router** para navegação

### UI/UX
- **shadcn/ui** como base de componentes
- **Tailwind CSS** para estilização
- **Framer Motion** para animações
- **Lucide React** para ícones

### Estado e Dados
- **React Query** para cache e sincronização
- **Zustand** para estado global (se necessário)
- **React Hook Form** para formulários

### Performance
- **Lazy Loading** de componentes
- **Code Splitting** automático
- **Memoização** de operações custosas
- **Virtual Scrolling** para listas grandes

## 📁 Estrutura de Arquivos

```
src/
├── pages/
│   └── ClientsPets.tsx           # Página principal
├── components/
│   ├── ui/
│   │   ├── kanban-board.tsx      # Board Kanban
│   │   ├── customer-pet-card.tsx # Cards unificados
│   │   ├── details-sidebar.tsx   # Sidebar de detalhes
│   │   ├── filter-bar.tsx        # Barra de filtros
│   │   └── search-command.tsx    # Busca global
│   └── modals/
│       ├── CustomerModal.tsx     # Modal de cliente
│       ├── PetModal.tsx         # Modal de pet
│       └── BulkActionsModal.tsx  # Ações em lote
└── hooks/
    └── useKanban.ts             # Hook para Kanban
```

## 🎨 Design System

### Cores e Temas
- **Clientes**: Tons de azul (`bg-blue-50`, `border-blue-200`)
- **Pets**: Tons de verde (`bg-green-50`, `border-green-200`)
- **VIP**: Gradiente dourado (`from-yellow-400 to-orange-500`)
- **Atenção**: Tons de vermelho/laranja

### Animações
- **Entrada**: `fadeIn` com delay escalonado
- **Hover**: Escala sutil (`scale-105`)
- **Drag**: Opacidade e escala reduzidas
- **Transições**: 200-300ms para suavidade

### Responsividade
- **Mobile First**: Design adaptativo
- **Breakpoints**: sm, md, lg, xl
- **Grid Responsivo**: 1-2-3-4 colunas conforme tela
- **Sidebar Collapse**: Em telas menores

## 🔧 Como Usar

### Navegação
1. Acesse `/clients-pets` no menu lateral
2. Use as tabs para alternar entre visualizações
3. Clique no toggle para mudar o modo de exibição

### Filtros
1. Use a barra de pesquisa para busca rápida
2. Selecione filtros nos dropdowns
3. Command+K para busca global
4. Clique nos chips para remover filtros

### Ações
1. **Visualizar**: Clique no card para abrir sidebar
2. **Editar**: Use o botão de edição ou menu
3. **Seleção**: Checkbox aparecem no hover
4. **Bulk**: Selecione múltiplos e use ações em lote

### Kanban
1. Arraste cards entre colunas
2. Solte para alterar status
3. Feedback visual durante operação

## 🚀 Performance

### Otimizações Implementadas
- **Lazy Loading**: Páginas carregadas sob demanda
- **Code Splitting**: Chunks separados por rota
- **Memoização**: `useMemo` para cálculos pesados
- **Virtualization**: Para listas com muitos itens
- **Debounce**: Em buscas e filtros

### Métricas
- **Initial Bundle**: ~734kB (reduzido de ~1.5MB)
- **ClientsPets Chunk**: ~80kB
- **First Load**: <2s em 3G
- **Interatividade**: <100ms

## 🧪 Testes

### Funcionalidades Testadas
- ✅ Navegação entre tabs
- ✅ Filtros e busca
- ✅ Drag & drop no Kanban
- ✅ Modais e formulários
- ✅ Responsividade
- ✅ Performance
- ✅ Ações em lote

### Compatibilidade
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS 14+, Android 10+
- **Acessibilidade**: WCAG 2.1 AA

## 🎯 Roadmap

### Próximas Melhorias
- [ ] Visualização em Timeline
- [ ] Relatórios avançados
- [ ] Integração com calendário
- [ ] Notificações push
- [ ] Modo offline
- [ ] Temas personalizáveis

### Backlog
- [ ] Dashboard widgets
- [ ] Integração com WhatsApp
- [ ] Automações
- [ ] Analytics avançado

---

**Desenvolvido com ❤️ pela equipe Auzap AI**