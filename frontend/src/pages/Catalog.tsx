import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Tag,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  useCatalogItems,
  useCatalogStats,
  useCatalogCategories,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeleteCatalogItem,
  useUpdateCatalogItemImage,
  useOrganizationId,
} from "@/hooks/useApiData";

// Form state interface
interface CatalogItemForm {
  name: string;
  description: string;
  category: string;
  price: number;
  duration_minutes?: number;
  requires_appointment: boolean;
  tags: string[];
  image_url?: string;
  is_active: boolean;
}

// Empty form data
const emptyFormData: CatalogItemForm = {
  name: "",
  description: "",
  category: "",
  price: 0,
  duration_minutes: undefined,
  requires_appointment: false,
  tags: [],
  image_url: "",
  is_active: true,
};

const Catalog = () => {
  const activeMenuItem = useActiveNavigation();
  const organizationId = useOrganizationId();

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // State for modals
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<CatalogItemForm>(emptyFormData);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Create filters object for API
  const filters = useMemo(() => {
    const apiFilters: any = {
      search: searchTerm || undefined,
      category: filterCategory === "all" ? undefined : filterCategory,
      is_active: filterStatus === "all" ? undefined : filterStatus,
    };

    // Remove undefined values
    Object.keys(apiFilters).forEach(key => {
      if (apiFilters[key] === undefined) {
        delete apiFilters[key];
      }
    });

    return apiFilters;
  }, [searchTerm, filterCategory, filterStatus]);

  // API hooks
  const { data: catalogItems = [], isLoading: isLoadingItems, error: itemsError } = useCatalogItems(organizationId, filters);
  const { data: catalogStats, isLoading: isLoadingStats } = useCatalogStats(organizationId);
  const { data: categories = [], isLoading: isLoadingCategories } = useCatalogCategories(organizationId);

  // Mutation hooks
  const createItemMutation = useCreateCatalogItem();
  const updateItemMutation = useUpdateCatalogItem();
  const deleteItemMutation = useDeleteCatalogItem();
  const updateImageMutation = useUpdateCatalogItemImage();

  // Prepare categories for select dropdown
  const categoriesForSelect = useMemo(() => {
    const defaultCategories = [{ name: "Todos", count: 0, slug: "all" }];
    return defaultCategories.concat(categories);
  }, [categories]);

  // Calculate local stats for display (with fallback for loading)
  const displayStats = useMemo(() => {
    if (catalogStats) {
      return {
        total: catalogStats.total_items,
        services: catalogItems.filter(item => item.requires_appointment).length,
        products: catalogItems.filter(item => !item.requires_appointment).length,
        popular: catalogItems.filter(item => item.popular).length,
      };
    }

    // Fallback calculation from current items
    return {
      total: catalogItems.length,
      services: catalogItems.filter(item => item.requires_appointment).length,
      products: catalogItems.filter(item => !item.requires_appointment).length,
      popular: catalogItems.filter(item => item.popular).length,
    };
  }, [catalogStats, catalogItems]);

  // Form handlers
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category.trim() || formData.price <= 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsFormSubmitting(true);

    try {
      if (selectedItem) {
        // Update existing item
        await updateItemMutation.mutateAsync({
          id: selectedItem.id,
          updates: {
            ...formData,
            // Convert duration from minutes if provided
            duration_minutes: formData.duration_minutes || undefined,
          }
        });
        toast.success("Item atualizado com sucesso!");
        setIsEditDialogOpen(false);
      } else {
        // Create new item
        await createItemMutation.mutateAsync({
          ...formData,
          duration_minutes: formData.duration_minutes || undefined,
        });
        toast.success("Item criado com sucesso!");
        setIsCreateDialogOpen(false);
      }

      // Reset form
      setFormData(emptyFormData);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Erro ao salvar item");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      category: item.category || "",
      price: item.price || 0,
      duration_minutes: item.duration_minutes || undefined,
      requires_appointment: item.requires_appointment || false,
      tags: item.tags || [],
      image_url: item.image_url || "",
      is_active: item.is_active !== false,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await deleteItemMutation.mutateAsync(selectedItem.id);
      toast.success("Item excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || "Erro ao excluir item");
    }
  };

  const openDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setFormData(emptyFormData);
    setSelectedItem(null);
    setIsCreateDialogOpen(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="secondary" className="text-success">Ativo</Badge>
    ) : (
      <Badge variant="outline">Inativo</Badge>
    );
  };

  const getTypeIcon = (requiresAppointment: boolean) => {
    return requiresAppointment ? (
      <Clock className="h-4 w-4 text-primary" />
    ) : (
      <Package className="h-4 w-4 text-secondary" />
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    if (minutes >= 1440) {
      return `${Math.floor(minutes / 1440)} dia(s)`;
    }
    return `${minutes} min`;
  };

  // Loading skeleton component
  const ItemSkeleton = () => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9" />
          </div>
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
                <h1 className="text-3xl font-primary font-bold tracking-tight text-primary flex items-center gap-3">
                  <Package className="h-8 w-8" />
                  Catálogo
                </h1>
                <p className="text-muted-foreground font-secondary">
                  Gerencie seus produtos e serviços
                </p>
              </div>

              <Button
                onClick={openCreateDialog}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Item
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      {isLoadingStats ? (
                        <Skeleton className="h-8 w-12 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{displayStats.total}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Total Itens</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-secondary/10 p-3">
                      <Clock className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      {isLoadingStats ? (
                        <Skeleton className="h-8 w-12 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{displayStats.services}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Serviços</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-warning/10 p-3">
                      <Tag className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      {isLoadingStats ? (
                        <Skeleton className="h-8 w-12 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{displayStats.products}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Produtos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-success/10 p-3">
                      <TrendingUp className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      {isLoadingStats ? (
                        <Skeleton className="h-8 w-12 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{catalogStats?.appointment_required_items || 0}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Com Agendamento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar produtos e serviços..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : (
                        categoriesForSelect.map((category) => (
                          <SelectItem key={category.slug} value={category.slug}>
                            {category.name} {category.count > 0 && `(${category.count})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="true">Ativos</SelectItem>
                      <SelectItem value="false">Inativos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Mais Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingItems ? (
                // Show loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <ItemSkeleton key={`skeleton-${index}`} />
                ))
              ) : itemsError ? (
                // Show error state
                <div className="col-span-full text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Erro ao carregar itens</h3>
                  <p className="text-muted-foreground mb-4">
                    Ocorreu um erro ao carregar os itens do catálogo.
                  </p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Tentar Novamente
                  </Button>
                </div>
              ) : catalogItems.length === 0 ? (
                // Show empty state
                <div className="col-span-full text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                      ? "Tente ajustar os filtros para encontrar itens."
                      : "Comece adicionando seus primeiros produtos e serviços."}
                  </p>
                  <Button variant="outline" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Item
                  </Button>
                </div>
              ) : (
                // Show actual items
                catalogItems.map((item) => (
                <Card key={item.id} className="relative">
                  {item.popular && (
                    <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">
                      Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.requires_appointment)}
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                      </div>
                      {getStatusBadge(item.is_active)}
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold font-secondary text-primary">
                          R$ {item.price.toFixed(2)}
                        </span>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        {item.requires_appointment ? (
                          <>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDuration(item.duration_minutes) || "Não definido"}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {item.bookings || 0} agendamentos
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              {item.stock || 0} em estoque
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {item.sales || 0} vendas
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 mr-2"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setFormData(emptyFormData);
                setSelectedItem(null);
              }
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedItem ? "Editar Item" : "Adicionar ao Catálogo"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedItem ? "Edite as informações do item" : "Adicione um novo produto ou serviço ao seu catálogo"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome *</label>
                      <Input
                        placeholder="Nome do produto/serviço"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Categoria *</label>
                      <Input
                        placeholder="Ex: Serviços, Produtos"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preço (R$) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={formData.price || ""}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duração (min)</label>
                      <Input
                        type="number"
                        placeholder="Ex: 90"
                        value={formData.duration_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL da Imagem</label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={formData.image_url || ""}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      placeholder="Descrição detalhada do produto ou serviço"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requires_appointment"
                        checked={formData.requires_appointment}
                        onChange={(e) => setFormData({ ...formData, requires_appointment: e.target.checked })}
                      />
                      <label htmlFor="requires_appointment" className="text-sm font-medium">
                        Requer agendamento
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <label htmlFor="is_active" className="text-sm font-medium">
                        Ativo
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      setIsEditDialogOpen(false);
                      setFormData(emptyFormData);
                      setSelectedItem(null);
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isFormSubmitting}>
                      {isFormSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        selectedItem ? "Atualizar Item" : "Adicionar ao Catálogo"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza de que deseja excluir "{selectedItem?.name}"?
                    Esta ação irá desativar o item (não será permanentemente removido).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir Item
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Catalog;