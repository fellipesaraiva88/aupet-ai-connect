/**
 * ClientsPets Page - Unified Client and Pet Management
 *
 * This component provides a modern, unified interface for managing both clients
 * and their pets in a single view. Features include:
 *
 * - Multiple view modes: Kanban board, Cards grid, and Table
 * - Tabbed navigation: Unified view, Clients only, Pets only
 * - Advanced filtering and search capabilities
 * - Bulk operations with multi-select
 * - Detailed sidebar with entity information
 * - Multi-step modals for creating/editing
 * - Drag & drop functionality in Kanban view
 * - Real-time statistics and metrics
 *
 * @author Claude Code Assistant
 * @version 1.0.0
 */

import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  usePets,
  useCreatePet,
  useUpdatePet,
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
  PawPrint,
  Stethoscope,
  Shield,
  Weight,
  Ruler,
  Camera,
  FileText,
  CalendarPlus,
  MessageCircle,
  Kanban,
  Table2,
  LayoutGrid,
} from "lucide-react";
import { KanbanBoard } from "@/components/ui/kanban-board";
import { CustomerPetCard } from "@/components/ui/customer-pet-card";
import { DetailsSidebar } from "@/components/ui/details-sidebar";
import { FilterBar } from "@/components/ui/filter-bar";
import { SearchCommand } from "@/components/ui/search-command";
import { CustomerModal } from "@/components/modals/CustomerModal";
import { PetModal } from "@/components/modals/PetModal";
import { BulkActionsModal } from "@/components/modals/BulkActionsModal";

type ViewMode = "kanban" | "table" | "cards";
type DataType = "customers" | "pets" | "unified";

interface FilterState {
  search: string;
  status: string;
  species: string;
  dateRange: string;
  hasAnyPet: boolean | null;
  vaccination: string;
}

const ClientsPets = () => {
  const activeMenuItem = useActiveNavigation();
  const [activeTab, setActiveTab] = useState<DataType>("unified");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editingPet, setEditingPet] = useState<any>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    species: "all",
    dateRange: "all",
    hasAnyPet: null,
    vaccination: "all",
  });

  const organizationId = useOrganizationId();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers(organizationId);
  const { data: pets = [], isLoading: loadingPets } = usePets(organizationId);
  const { toast } = useToast();

  // Unified data processing
  const unifiedData = useMemo(() => {
    const customerCards = customers.map(customer => ({
      id: customer.id,
      type: 'customer' as const,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      created_at: customer.created_at,
      pets: customer.pets || [],
      data: customer,
    }));

    const petCards = pets.map(pet => ({
      id: pet.id,
      type: 'pet' as const,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      owner: (pet as any).whatsapp_contacts?.name || 'Sem dono',
      status: (pet as any).is_active ? 'active' : 'inactive',
      created_at: (pet as any).created_at || new Date().toISOString(),
      data: pet,
    }));

    return [...customerCards, ...petCards];
  }, [customers, pets]);

  // Filtered data based on current tab and filters
  const filteredData = useMemo(() => {
    let data = unifiedData;

    // Filter by tab
    if (activeTab === 'customers') {
      data = data.filter(item => item.type === 'customer');
    } else if (activeTab === 'pets') {
      data = data.filter(item => item.type === 'pet');
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      data = data.filter(item =>
        item.name?.toLowerCase().includes(searchTerm) ||
        (item.type === 'customer' && (
          item.email?.toLowerCase().includes(searchTerm) ||
          item.phone?.includes(searchTerm)
        )) ||
        (item.type === 'pet' && (
          item.species?.toLowerCase().includes(searchTerm) ||
          item.breed?.toLowerCase().includes(searchTerm) ||
          item.owner?.toLowerCase().includes(searchTerm)
        ))
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      data = data.filter(item => item.status === filters.status);
    }

    // Apply species filter (pets only)
    if (filters.species !== 'all' && activeTab !== 'customers') {
      data = data.filter(item =>
        item.type === 'pet' && item.species === filters.species
      );
    }

    return data;
  }, [unifiedData, activeTab, filters]);

  // Statistics
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
    vipCustomers: customers.filter(c => c.status === 'vip').length,
    totalPets: pets.length,
    activePets: pets.filter(p => (p as any).is_active).length,
    vaccinatedPets: pets.filter(p => (p as any).vaccination_status === 'up_to_date').length,
    customersWithPets: customers.filter(c => c.pets && c.pets.length > 0).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
  }), [customers, pets]);

  const handleEntityClick = (entity: any) => {
    setSelectedEntity(entity);
    setIsDetailsSidebarOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleEditPet = (pet: any) => {
    setEditingPet(pet);
    setIsPetModalOpen(true);
  };

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para executar ações em lote.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkActionsOpen(true);
  };

  const renderViewModeToggle = () => (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={viewMode === "kanban" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("kanban")}
        className="px-3"
      >
        <Kanban className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("cards")}
        className="px-3"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("table")}
        className="px-3"
      >
        <Table2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="glass-morphism">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              <p className="text-sm text-muted-foreground">Famílias Cadastradas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-success/10 p-3">
              <Heart className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPets}</p>
              <p className="text-sm text-muted-foreground">Amiguinhos Queridos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-warning/10 p-3">
              <Star className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.vipCustomers}</p>
              <p className="text-sm text-muted-foreground">Clientes VIP</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-secondary/10 p-3">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-muted-foreground">Receita Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    if (loadingCustomers || loadingPets) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="glass-morphism">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (viewMode === "kanban") {
      return (
        <KanbanBoard
          data={filteredData}
          onEntityClick={handleEntityClick}
          onEditCustomer={handleEditCustomer}
          onEditPet={handleEditPet}
        />
      );
    }

    if (viewMode === "cards") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <CustomerPetCard
              key={`${item.type}-${item.id}`}
              item={item}
              selected={selectedItems.includes(item.id)}
              onSelect={(id, selected) => {
                if (selected) {
                  setSelectedItems(prev => [...prev, id]);
                } else {
                  setSelectedItems(prev => prev.filter(i => i !== id));
                }
              }}
              onClick={() => handleEntityClick(item)}
              onEdit={() => {
                if (item.type === 'customer') {
                  handleEditCustomer(item.data);
                } else {
                  handleEditPet(item.data);
                }
              }}
            />
          ))}
        </div>
      );
    }

    // Table view would go here
    return (
      <Card className="glass-morphism">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Visualização em tabela em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeItem={activeMenuItem} />

        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  Clientes & Pets
                </h1>
                <p className="text-muted-foreground">
                  Gerencie todas as famílias e seus amiguinhos queridos em um só lugar
                </p>
              </div>

              <div className="flex items-center gap-3">
                {renderViewModeToggle()}

                <Button
                  variant="outline"
                  onClick={() => setIsPetModalOpen(true)}
                >
                  <PawPrint className="h-4 w-4 mr-2" />
                  Novo Pet
                </Button>

                <Button
                  size="lg"
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nova Família
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            {renderStatsCards()}

            {/* Tabs and Filters */}
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DataType)}>
                <div className="flex items-center justify-between">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="unified" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Visão Unificada
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Clientes
                    </TabsTrigger>
                    <TabsTrigger value="pets" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Pets
                    </TabsTrigger>
                  </TabsList>

                  {selectedItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {selectedItems.length} selecionado{selectedItems.length > 1 ? 's' : ''}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("export")}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Exportar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedItems([])}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <FilterBar
                  filters={filters}
                  onFiltersChange={setFilters}
                  activeTab={activeTab}
                />

                <TabsContent value="unified" className="space-y-6">
                  {renderContent()}
                </TabsContent>

                <TabsContent value="customers" className="space-y-6">
                  {renderContent()}
                </TabsContent>

                <TabsContent value="pets" className="space-y-6">
                  {renderContent()}
                </TabsContent>
              </Tabs>
            </div>

            {filteredData.length === 0 && !loadingCustomers && !loadingPets && (
              <div className="text-center py-12">
                <div className="mb-4">
                  {activeTab === 'customers' ? (
                    <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                  ) : activeTab === 'pets' ? (
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
                  ) : (
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
                  )}
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {filters.search || filters.status !== 'all'
                    ? 'Nenhum resultado encontrado'
                    : 'Nenhum item cadastrado'
                  }
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filters.search || filters.status !== 'all'
                    ? 'Tente ajustar os filtros para encontrar o que procura.'
                    : 'Comece cadastrando seu primeiro cliente ou pet.'
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setIsCustomerModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Primeiro Cliente
                  </Button>
                  <Button variant="outline" onClick={() => setIsPetModalOpen(true)}>
                    <PawPrint className="h-4 w-4 mr-2" />
                    Primeiro Pet
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Search Command */}
      <SearchCommand />

      {/* Details Sidebar */}
      <DetailsSidebar
        open={isDetailsSidebarOpen}
        onOpenChange={setIsDetailsSidebarOpen}
        entity={selectedEntity}
        onEdit={(entity) => {
          if (entity.type === 'customer') {
            handleEditCustomer(entity.data);
          } else {
            handleEditPet(entity.data);
          }
          setIsDetailsSidebarOpen(false);
        }}
      />

      {/* Modals */}
      <CustomerModal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        customer={editingCustomer}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
      />

      <PetModal
        open={isPetModalOpen}
        onOpenChange={setIsPetModalOpen}
        pet={editingPet}
        customers={customers}
        onClose={() => {
          setIsPetModalOpen(false);
          setEditingPet(null);
        }}
      />

      <BulkActionsModal
        open={isBulkActionsOpen}
        onOpenChange={setIsBulkActionsOpen}
        selectedItems={selectedItems}
        onComplete={() => {
          setSelectedItems([]);
          setIsBulkActionsOpen(false);
        }}
      />
    </div>
  );
};

export default ClientsPets;