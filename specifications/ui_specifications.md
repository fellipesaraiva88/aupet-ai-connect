# UI Component Specifications

This document defines all frontend components and their functionality required to resurrect the 107 dead functionalities identified in the audit. Every button, form, and interaction must be implemented with proper event handlers and real data integration.

## Current State Issues

According to the audit, all pages suffer from:
- Dead buttons with no onClick handlers (107 total)
- Forms with no onChange/onSubmit handlers
- Hardcoded mock data instead of real API integration
- Broken navigation with empty onItemClick callbacks
- No loading states or error handling
- No form validation

## Design System Foundation

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: Radix UI primitives for accessibility
- **Forms**: react-hook-form with Zod validation
- **State Management**: React Query for server state, Zustand for client state
- **Icons**: Lucide React icons
- **Animations**: Framer Motion for smooth transitions

### Theme Configuration
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a'
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569'
        }
      },
      fontFamily: {
        primary: ['Inter', 'sans-serif'],
        secondary: ['Inter', 'sans-serif']
      }
    }
  }
}
```

## 1. Authentication Components

### LoginForm Component
**Location**: `/frontend/src/components/auth/LoginForm.tsx`

**Required Functionality**:
```tsx
const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signIn(data.email, data.password, data.rememberMe);
      // Redirect to dashboard
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Form UI with validation states, loading states, and error display
};
```

**UI Elements**:
- Email input with validation styling
- Password input with show/hide toggle
- "Remember me" checkbox
- Submit button with loading spinner
- Error message display
- "Forgot password" link
- Professional pet care themed styling

### ProtectedRoute Component
**Fixes Required**:
- Replace empty shell with actual protection logic
- Check authentication status
- Verify user permissions
- Handle loading states during auth check
- Provide fallback UI for unauthorized access

## 2. Dashboard Page Components

### Index.tsx - Main Dashboard
**Dead Buttons to Fix**:

1. **"Ver histórico completo" Button**
```tsx
<Button
  onClick={() => navigate('/analytics/history')}
  variant="outline"
>
  Ver histórico completo
</Button>
```

2. **"Como estou crescendo?" Button**
```tsx
<Button
  onClick={() => navigate('/analytics/growth')}
  variant="ghost"
>
  Como estou crescendo?
</Button>
```

3. **"Conversar" Button**
```tsx
<Button
  onClick={() => navigate('/conversations')}
  className="gap-2"
>
  <MessageSquare className="h-4 w-4" />
  Conversar
</Button>
```

4. **"Agendar Cuidado" Button**
```tsx
<Button
  onClick={() => navigate('/appointments/new')}
  className="gap-2"
>
  <Calendar className="h-4 w-4" />
  Agendar Cuidado
</Button>
```

5. **"Novo Cliente" Button**
```tsx
<Button
  onClick={() => navigate('/customers/new')}
  variant="secondary"
>
  <Users className="h-4 w-4 mr-2" />
  Novo Cliente
</Button>
```

6. **"Novo Amiguinho" Button**
```tsx
<Button
  onClick={() => navigate('/pets/new')}
  variant="secondary"
>
  <Heart className="h-4 w-4 mr-2" />
  Novo Amiguinho
</Button>
```

### StatsOverview Component
**Data Integration Required**:
- Replace hardcoded stats with real API data
- Add loading skeletons
- Implement error handling
- Add click handlers for drill-down navigation

```tsx
const StatsOverview = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.get('/dashboard/stats')
  });

  if (isLoading) return <StatsOverviewSkeleton />;
  if (error) return <ErrorMessage />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total de Clientes"
        value={stats.customers.total}
        change={stats.customers.growth_percentage}
        onClick={() => navigate('/customers')}
      />
      {/* Other stats cards */}
    </div>
  );
};
```

## 3. Conversations Page Components

### Conversations.tsx
**Dead Elements to Fix**:

1. **Search Input**
```tsx
<Input
  placeholder="Buscar conversas..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="max-w-sm"
/>
```

2. **Filters Button**
```tsx
<Button
  variant="outline"
  onClick={() => setShowFilters(!showFilters)}
>
  <Filter className="h-4 w-4 mr-2" />
  Filtros
</Button>
```

3. **Phone Call Button**
```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={() => handlePhoneCall(conversation.customer.phone)}
>
  <Phone className="h-4 w-4" />
</Button>
```

4. **Video Call Button**
```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={() => handleVideoCall(conversation.id)}
>
  <Video className="h-4 w-4" />
</Button>
```

5. **More Actions Button**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm" variant="ghost">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => handleAssignConversation(conversation.id)}>
      Atribuir conversa
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleEscalateConversation(conversation.id)}>
      Escalar para humano
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleArchiveConversation(conversation.id)}>
      Arquivar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

6. **Message Input with Attachments**
```tsx
<div className="flex items-center space-x-2">
  <Button
    type="button"
    size="sm"
    variant="ghost"
    onClick={() => fileInputRef.current?.click()}
  >
    <Paperclip className="h-4 w-4" />
  </Button>
  <Button
    type="button"
    size="sm"
    variant="ghost"
    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
  >
    <Smile className="h-4 w-4" />
  </Button>
  <Input
    value={messageText}
    onChange={(e) => setMessageText(e.target.value)}
    placeholder="Digite sua mensagem..."
    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
  />
  <Button
    type="button"
    onClick={handleSendMessage}
    disabled={!messageText.trim()}
  >
    <Send className="h-4 w-4" />
  </Button>
</div>
```

7. **"Ver História Completa" Button**
```tsx
<Button
  variant="outline"
  onClick={() => navigate(`/conversations/${conversation.id}/history`)}
>
  Ver História Completa
</Button>
```

### ConversationList Component
**Features Required**:
- Real-time message updates via WebSocket
- Infinite scroll pagination
- Search and filter functionality
- Conversation status indicators
- Unread message counts
- Last message preview

### MessageBubble Component
**Features Required**:
- Different styles for customer/AI/human messages
- Message status indicators (sent, delivered, read)
- Timestamp formatting
- Media message support (images, documents)
- Message actions (copy, forward, delete)

## 4. AI Configuration Page Components

### AIConfig.tsx
**Dead Elements to Fix**:

1. **"Testar IA" Button**
```tsx
<Button
  onClick={handleTestAI}
  disabled={isLoading}
  className="gap-2"
>
  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
  Testar IA
</Button>
```

2. **"Salvar Configurações" Button**
```tsx
<Button
  type="submit"
  onClick={form.handleSubmit(onSubmit)}
  disabled={!form.formState.isDirty || isLoading}
>
  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
  Salvar Configurações
</Button>
```

3. **Form Inputs with Validation**
```tsx
// Assistant Name
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nome da Assistente</FormLabel>
      <FormControl>
        <Input {...field} onChange={(e) => {
          field.onChange(e);
          handleFieldChange('name', e.target.value);
        }} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// Personality Select
<FormField
  control={form.control}
  name="personality"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tipo de Personalidade</FormLabel>
      <Select onValueChange={(value) => {
        field.onChange(value);
        handleFieldChange('personality', value);
      }} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a personalidade" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="friendly">Amigável</SelectItem>
          <SelectItem value="professional">Profissional</SelectItem>
          <SelectItem value="casual">Descontraído</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

// System Prompt Textarea
<FormField
  control={form.control}
  name="system_prompt"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Prompt do Sistema</FormLabel>
      <FormControl>
        <Textarea
          {...field}
          onChange={(e) => {
            field.onChange(e);
            handleFieldChange('system_prompt', e.target.value);
          }}
          rows={6}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// All automation switches
<FormField
  control={form.control}
  name="auto_reply_enabled"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">Resposta Automática</FormLabel>
        <FormDescription>
          Permitir que a IA responda automaticamente às mensagens
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={(checked) => {
            field.onChange(checked);
            handleFieldChange('auto_reply_enabled', checked);
          }}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

### AITestPanel Component
**New Component Required**:
```tsx
const AITestPanel = () => {
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/ai/configurations/test', {
        input: testInput,
        config_id: currentConfigId
      });
      setTestOutput(response.data.response);
    } catch (error) {
      setTestOutput('Erro ao testar IA: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testar Configuração</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Digite uma mensagem de teste..."
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
        />
        <Button onClick={handleTest} disabled={!testInput || isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Testar
        </Button>
        {testOutput && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{testOutput}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

## 5. Customer Management Components

### Customers.tsx
**Required Functionality**:
- Add customer button with modal form
- Search and filter functionality
- Customer list with pagination
- Customer detail view
- Edit customer modal
- Delete confirmation
- Export customers feature

### CustomerForm Component
```tsx
const CustomerForm = ({ customer, onSave, onCancel }) => {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: '',
      tags: []
    }
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (customer?.id) {
        await apiClient.put(`/customers/${customer.id}`, data);
      } else {
        await apiClient.post('/customers', data);
      }
      onSave();
    } catch (error) {
      // Handle error
    }
  };

  // Form implementation with all fields
};
```

## 6. Pet Management Components

### Pets.tsx
**Required Functionality**:
- Add pet button with form
- Pet gallery view
- Pet health records
- Vaccination tracking
- Photo upload
- Medical history timeline

### PetCard Component
```tsx
const PetCard = ({ pet }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={pet.photo_url} alt={pet.name} />
            <AvatarFallback>{pet.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{pet.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {pet.breed} • {calculateAge(pet.birth_date)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Badge variant="secondary">{pet.species}</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/pets/${pet.id}`)}
          >
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 7. Appointment Management Components

### Appointments.tsx
**Required Functionality**:
- Calendar view with day/week/month options
- Add appointment button with time slots
- Appointment status updates
- Drag and drop rescheduling
- Appointment reminders
- Resource scheduling

### AppointmentCalendar Component
```tsx
const AppointmentCalendar = () => {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', view, selectedDate],
    queryFn: () => apiClient.get(`/appointments?view=${view}&date=${selectedDate.toISOString()}`)
  });

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleTimeSlotClick = (dateTime) => {
    setSelectedDateTime(dateTime);
    setShowNewAppointmentModal(true);
  };

  // Calendar implementation with proper event handlers
};
```

## 8. Layout Components

### Sidebar Component
**Fixes Required**:
- Replace empty onItemClick with proper navigation
- Add active state highlighting
- Implement proper routing
- Add role-based menu visibility

```tsx
const Sidebar = ({ activeItem, onItemClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'conversations', label: 'Conversas', icon: MessageSquare, path: '/conversations' },
    { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
    { id: 'pets', label: 'Pets', icon: Heart, path: '/pets' },
    { id: 'appointments', label: 'Agendamentos', icon: Calendar, path: '/appointments' },
    { id: 'catalog', label: 'Catálogo', icon: Package, path: '/catalog', roles: ['admin', 'manager'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart, path: '/analytics' },
    { id: 'ai-config', label: 'Config. IA', icon: Bot, path: '/ai-config', roles: ['admin'] },
    { id: 'settings', label: 'Configurações', icon: Settings, path: '/settings', roles: ['admin', 'manager'] }
  ];

  const handleItemClick = (item) => {
    onItemClick(item.id);
    navigate(item.path);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <nav className="mt-8">
        {menuItems
          .filter(item => !item.roles || item.roles.includes(user?.role))
          .map((item) => (
            <SidebarItem
              key={item.id}
              {...item}
              isActive={activeItem === item.id}
              onClick={() => handleItemClick(item)}
            />
          ))}
      </nav>
    </div>
  );
};
```

## 9. Form Validation Schemas

### Zod Validation Schemas
```typescript
// Customer validation
export const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().regex(/^\+55\d{10,11}$/, 'Telefone deve estar no formato +55XXXXXXXXXXX'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Pet validation
export const petSchema = z.object({
  customer_id: z.string().uuid('Cliente é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  species: z.string().min(1, 'Espécie é obrigatória'),
  breed: z.string().optional(),
  color: z.string().optional(),
  gender: z.enum(['male', 'female'], { required_error: 'Sexo é obrigatório' }),
  birth_date: z.date().optional(),
  weight: z.number().positive('Peso deve ser positivo').optional(),
  microchip_number: z.string().optional(),
  special_needs: z.string().optional(),
  allergies: z.array(z.string()).optional()
});

// Appointment validation
export const appointmentSchema = z.object({
  customer_id: z.string().uuid('Cliente é obrigatório'),
  pet_id: z.string().uuid('Pet é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  appointment_type: z.string().min(1, 'Tipo é obrigatório'),
  start_time: z.date('Data/hora de início é obrigatória'),
  end_time: z.date('Data/hora de fim é obrigatória'),
  estimated_cost: z.number().positive().optional()
}).refine(data => data.end_time > data.start_time, {
  message: 'Hora de fim deve ser posterior à hora de início',
  path: ['end_time']
});
```

## 10. Error Handling and Loading States

### Error Boundary Component
```tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
```

### Loading Skeletons
```tsx
const CustomerListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
```

## 11. Real-time Updates

### WebSocket Integration
```tsx
const useRealTimeUpdates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.organization_id) return;

    const ws = new WebSocket(`${WS_URL}/api/v1/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join_room',
        organization_id: user.organization_id
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'new_message':
          queryClient.invalidateQueries(['conversations']);
          break;
        case 'conversation_assigned':
          queryClient.invalidateQueries(['conversations']);
          break;
        case 'appointment_updated':
          queryClient.invalidateQueries(['appointments']);
          break;
      }
    };

    return () => ws.close();
  }, [user?.organization_id, queryClient]);
};
```

This comprehensive UI specification addresses all 107 dead functionalities identified in the audit, providing detailed implementation requirements for every component, form, and interaction needed to resurrect the Auzap system.