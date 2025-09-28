import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ModernCard, ModernStatsGrid } from "@/components/ui/modern-card";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useOrganizationId,
} from "@/hooks/useApiData";
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  MessageSquare,
  Calendar,
  Heart,
  TrendingUp,
  User,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash,
  Loader2,
  Mail,
  Eye,
  Star,
  Activity,
  ShoppingBag,
  Clock,
  Download,
  Upload,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
  Settings,
  Grid3x3,
  List,
  UserPlus,
  RefreshCw,
} from "lucide-react";

type CustomerFormData = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  status?: string;
  preferredContact?: string;
  birthDate?: string;
};

type ViewMode = "grid" | "table";
type SortField = "name" | "email" | "created_at" | "total_spent" | "last_interaction";
type SortOrder = "asc" | "desc";

interface FilterState {
  status: string;
  dateRange: string;
  totalSpent: string;
  hasAnyPet: boolean | null;
}

const Customers = () => {
  const activeMenuItem = useActiveNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    status: "active",
    preferredContact: "whatsapp",
    birthDate: "",
  });
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    dateRange: "all",
    totalSpent: "all",
    hasAnyPet: null,
  });

  const organizationId = useOrganizationId();
  const { data: customers = [], isLoading, error, refetch } = useCustomers(organizationId);
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();
  const { toast } = useToast();

  // Lógica avançada de filtragem e ordenação
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter((customer) => {
      // Busca por texto
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(searchTerm) ||
        customer.address?.toLowerCase().includes(searchLower);

      // Filtro por status
      const matchesStatus = filters.status === "all" || customer.status === filters.status;

      // Filtro por pets
      const matchesPets = filters.hasAnyPet === null ||
        (filters.hasAnyPet ? (customer.pets && customer.pets.length > 0) : !customer.pets || customer.pets.length === 0);

      // Filtro por data de criação
      const matchesDateRange = (() => {
        if (filters.dateRange === "all") return true;
        const customerDate = new Date(customer.created_at);
        const now = new Date();

        switch (filters.dateRange) {
          case "today":
            return customerDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return customerDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return customerDate >= monthAgo;
          case "year":
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return customerDate >= yearAgo;
          default:
            return true;
        }
      })();

      // Filtro por valor gasto
      const matchesTotalSpent = (() => {
        if (filters.totalSpent === "all") return true;
        const spent = customer.total_spent || 0;

        switch (filters.totalSpent) {
          case "0-100":
            return spent <= 100;
          case "100-500":
            return spent > 100 && spent <= 500;
          case "500-1000":
            return spent > 500 && spent <= 1000;
          case "1000+":
            return spent > 1000;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesPets && matchesDateRange && matchesTotalSpent;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case "total_spent":
          aValue = a.total_spent || 0;
          bValue = b.total_spent || 0;
          break;
        case "last_interaction":
          aValue = a.last_interaction ? new Date(a.last_interaction) : new Date(0);
          bValue = b.last_interaction ? new Date(b.last_interaction) : new Date(0);
          break;
        default:
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [customers, searchTerm, filters, sortField, sortOrder]);

  // Estatísticas calculadas
  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.status === "active").length,
    vip: customers.filter(c => c.status === "vip").length,
    inactive: customers.filter(c => c.status === "inactive").length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    avgSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length : 0,
    withPets: customers.filter(c => c.pets && c.pets.length > 0).length,
    newThisMonth: customers.filter(c => {
      const customerDate = new Date(c.created_at);
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return customerDate >= monthAgo;
    }).length,
  }), [customers]);

  // Funções de manipulação
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomerMutation.mutateAsync({
          id: editingCustomer.id,
          updates: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            notes: formData.notes,
            status: formData.status,
            preferredContact: formData.preferredContact,
            birthDate: formData.birthDate,
          },
        });
        toast({
          title: "Família cuidada com sucesso! 💝",
          description: "As informações foram atualizadas para continuarmos cuidando ainda melhor.",
        });
      } else {
        await createCustomerMutation.mutateAsync({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
          status: formData.status || "active",
          preferredContact: formData.preferredContact,
          birthDate: formData.birthDate,
          organization_id: organizationId,
        });
        toast({
          title: "Nova família acolhida! 🏠",
          description: "Que alegria ter vocês conosco! Estamos prontos para cuidar com muito carinho.",
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Ops, algo não saiu como esperado",
        description: "Não se preocupe, vamos resolver isso juntos. Tente novamente em um momentinho.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || "",
      status: customer.status || "active",
      preferredContact: customer.preferredContact || "whatsapp",
      birthDate: customer.birthDate || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (customerId: string) => {
    try {
      await deleteCustomerMutation.mutateAsync(customerId);
      toast({
        title: "Cliente removido com cuidado",
        description: "As informações foram arquivadas com segurança.",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover cliente",
        description: "Não foi possível remover o cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      status: "active",
      preferredContact: "whatsapp",
      birthDate: "",
    });
  };

  const handleCancel = () => {
    handleCloseDialog();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      status: "all",
      dateRange: "all",
      totalSpent: "all",
      hasAnyPet: null,
    });
  };

  const handleExportData = () => {
    // Implementar exportação de dados
    toast({
      title: "Exportando dados...",
      description: "O arquivo será baixado em breve.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Ativo</Badge>;
      case "vip":
        return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none">
          <Star className="h-3 w-3 mr-1" />
          VIP
        </Badge>;
      case "inactive":
        return <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Componente de Card do Cliente para visualização em grid
  const CustomerCard = ({ customer }: { customer: any }) => (
    <Card className="glass-morphism hover:shadow-lg transition-all duration-300 group cursor-pointer"
          onClick={() => handleViewDetails(customer)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {customer.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {customer.name || 'Nome não informado'}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {customer.email || 'Email não informado'}
            </p>
            <div className="flex items-center mt-1">
              {getStatusBadge(customer.status || 'active')}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(customer);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleEdit(customer);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="h-4 w-4 mr-2" />
                Agendar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O cliente será removido permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(customer.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="h-4 w-4 mr-2" />
            {customer.phone || 'Não informado'}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}
          </div>

          {customer.pets && customer.pets.length > 0 ? (
            <div className="flex items-center text-sm">
              <Heart className="h-4 w-4 mr-2 text-primary" />
              <span className="text-primary font-medium">
                {customer.pets.length} pet{customer.pets.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center text-sm text-muted-foreground">
              <Heart className="h-4 w-4 mr-2" />
              Nenhum pet cadastrado
            </div>
          )}

          {customer.total_spent && customer.total_spent > 0 && (
            <div className="flex items-center text-sm">
              <ShoppingBag className="h-4 w-4 mr-2 text-success" />
              <span className="text-success font-medium">
                R$ {customer.total_spent.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeItem={activeMenuItem}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Clientes</h1>
                <p className="text-muted-foreground">
                  Gerencie todas as famílias que confiam em seus cuidados para seus pets
                </p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCustomer ? "Atualizar Informações da Família" : "Conhecer Nova Família"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCustomer ? "Vamos manter as informações sempre atualizadas para cuidar melhor" : "Conte-nos sobre esta nova família para que possamos cuidar com todo carinho"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Maria Silva"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="maria@email.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(11) 99999-9999"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Rua, número - Cidade, Estado"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                      >
                        {(createCustomerMutation.isPending || updateCustomerMutation.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {editingCustomer ? "Salvar com Carinho" : "Acolher Família"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <ModernStatsGrid>
              <ModernCard
                title="Total de Clientes"
                value={isLoading ? "..." : stats.total}
                subtitle="Famílias cadastradas"
                icon={Users}
                variant="default"
              />
              <ModernCard
                title="Clientes Ativos"
                value={isLoading ? "..." : stats.active}
                subtitle="Sempre presentes"
                icon={TrendingUp}
                trend={{
                  value: "+12%",
                  isPositive: true
                }}
                variant="gradient"
              />
              <ModernCard
                title="Clientes VIP"
                value={isLoading ? "..." : stats.vip}
                subtitle="Famílias especiais"
                icon={Star}
                variant="glass"
              />
              <ModernCard
                title="Receita Total"
                value={isLoading ? "..." : `R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`}
                subtitle="Confiança investida"
                icon={TrendingUp}
                trend={{
                  value: "+25%",
                  isPositive: true
                }}
                variant="default"
              />
            </ModernStatsGrid>

            {/* Filters */}
            <Card className="glass-morphism">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por nome, email ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-border/50 focus:bg-white focus:border-primary/50"
                    />
                  </div>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px] bg-white/50 border-border/50">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="bg-white/50 border-border/50 hover:bg-white hover:border-primary/50">
                    <Filter className="h-4 w-4 mr-2" />
                    Mais Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customers Table */}
            <Card className="glass-morphism">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>
                      {isLoading ? (
                        <Skeleton className="h-4 w-48" />
                      ) : (
                        `Mostrando ${filteredCustomers.length} de ${customers.length} clientes`
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Erro ao carregar clientes</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Pets</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-white">
                                  {customer.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{customer.name || 'Nome não informado'}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{customer.email || 'Não informado'}</p>
                              <p className="text-sm text-muted-foreground">{customer.phone || 'Não informado'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.pets && customer.pets.length > 0 ? (
                                customer.pets.map((pet: any, idx: number) => (
                                  <div key={idx} className="flex items-center text-sm">
                                    <Heart className="h-3 w-3 mr-1 text-primary" />
                                    {pet.name} ({pet.species})
                                  </div>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">Nenhum pet</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(customer.status || 'active')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Conversar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Agendar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {!isLoading && !error && filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Tente ajustar os filtros para encontrar clientes."
                    : "Comece cadastrando seu primeiro cliente."}
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Cliente
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Customers;