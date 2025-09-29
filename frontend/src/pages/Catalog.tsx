import React, { useState, useMemo, useCallback } from "react";
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
  Star,
  Heart,
  Eye,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  ShoppingCart,
  Calendar,
  Award,
  Zap,
  Sparkles,
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

// View mode type
type ViewMode = 'grid' | 'list';

// Sort option type
type SortOption = 'name' | 'price' | 'category' | 'created' | 'popular';

// Sort direction type
type SortDirection = 'asc' | 'desc';

// Filter state interface
interface FilterState {
  search: string;
  category: string;
  status: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  showFavoritesOnly: boolean;
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

  // Advanced filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    status: "all",
    sortBy: "name",
    sortDirection: "asc",
    viewMode: "grid",
    showFavoritesOnly: false,
  });

  // State for modals
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form and interaction state
  const [formData, setFormData] = useState<CatalogItemForm>(emptyFormData);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Create filters object for API with memoization
  const apiFilters = useMemo(() => {
    const baseFilters: any = {
      search: filters.search || undefined,
      category: filters.category === "all" ? undefined : filters.category,
      is_active: filters.status === "all" ? undefined : filters.status,
    };

    // Remove undefined values
    Object.keys(baseFilters).forEach(key => {
      if (baseFilters[key] === undefined) {
        delete baseFilters[key];
      }
    });

    return baseFilters;
  }, [filters.search, filters.category, filters.status]);

  // API hooks - moved before usage
  const { data: catalogItems = [], isLoading: isLoadingItems, error: itemsError } = useCatalogItems(organizationId, apiFilters);
  const { data: catalogStats, isLoading: isLoadingStats } = useCatalogStats(organizationId);
  const { data: categories = [], isLoading: isLoadingCategories } = useCatalogCategories(organizationId);

  // Filter and sort items with memoization
  const processedItems = useMemo(() => {
    let items = [...catalogItems];

    // Apply favorites filter
    if (filters.showFavoritesOnly) {
      items = items.filter(item => favoriteItems.has(item.id));
    }

    // Apply sorting
    items.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'popular':
          aValue = a.popular ? 1 : 0;
          bValue = b.popular ? 1 : 0;
          break;
        case 'created':
        default:
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
      }

      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [catalogItems, filters.sortBy, filters.sortDirection, filters.showFavoritesOnly, favoriteItems]);

  // Mutation hooks
  const createItemMutation = useCreateCatalogItem();
  const updateItemMutation = useUpdateCatalogItem();
  const deleteItemMutation = useDeleteCatalogItem();
  const updateImageMutation = useUpdateCatalogItemImage();

  // Prepare categories for select dropdown
  const categoriesForSelect = useMemo(() => {
    const defaultCategories = [{ name: "Todas as Categorias", count: 0, slug: "all" }];
    return defaultCategories.concat(categories);
  }, [categories]);

  // Filter update handlers with useCallback
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const toggleFavorite = useCallback((itemId: string) => {
    setFavoriteItems(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
        toast.success("Removido dos favoritos 💙");
      } else {
        newFavorites.add(itemId);
        toast.success("Adicionado aos favoritos ⭐");
      }
      return newFavorites;
    });
  }, []);

  const toggleSort = useCallback((sortBy: SortOption) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Calculate enhanced stats with filtered items
  const displayStats = useMemo(() => {
    const baseStats = {
      total: processedItems.length,
      services: processedItems.filter(item => item.requires_appointment).length,
      products: processedItems.filter(item => !item.requires_appointment).length,
      popular: processedItems.filter(item => item.popular).length,
      favorites: favoriteItems.size,
      active: processedItems.filter(item => item.is_active).length,
      revenue: processedItems.reduce((sum, item) => sum + (item.price || 0), 0),
    };

    // Add global stats if available
    if (catalogStats) {
      return {
        ...baseStats,
        totalGlobal: catalogStats.total_items,
        appointmentRequired: catalogStats.appointment_required_items || 0,
      };
    }

    return baseStats;
  }, [processedItems, favoriteItems.size, catalogStats]);

  // Form handlers with enhanced UX
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category.trim() || formData.price <= 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios 🐾");
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
            duration_minutes: formData.duration_minutes || undefined,
          }
        });
        toast.success(`${formData.name} foi atualizado com carinho! ✨`);
        setIsEditDialogOpen(false);
      } else {
        // Create new item
        await createItemMutation.mutateAsync({
          ...formData,
          duration_minutes: formData.duration_minutes || undefined,
        });
        toast.success(`${formData.name} foi adicionado ao catálogo! 🎉`);
        setIsCreateDialogOpen(false);
      }

      // Reset form
      setFormData(emptyFormData);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Ops, algo deu errado! Vamos tentar novamente? 🐾");
    } finally {
      setIsFormSubmitting(false);
    }
  }, [formData, selectedItem, updateItemMutation, createItemMutation]);

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

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;

    try {
      await deleteItemMutation.mutateAsync(selectedItem.id);
      toast.success(`${selectedItem.name} foi removido do catálogo 💙`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      // Remove from favorites if it was favorited
      setFavoriteItems(prev => {
        const newFavorites = new Set(prev);
        newFavorites.delete(selectedItem.id);
        return newFavorites;
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || "Ops, não conseguimos remover o item 🐾");
    }
  }, [selectedItem, deleteItemMutation]);

  const openDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setFormData(emptyFormData);
    setSelectedItem(null);
    setIsCreateDialogOpen(true);
  };

  // Enhanced component functions with pet-themed design
  const getStatusBadge = useCallback((isActive: boolean) => {
    return isActive ? (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
        ✅ Ativo
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
        ⏸️ Pausado
      </Badge>
    );
  }, []);

  const getTypeIcon = useCallback((requiresAppointment: boolean) => {
    return requiresAppointment ? (
      <div className="flex items-center gap-1 text-blue-600">
        <Calendar className="h-4 w-4" />
        <span className="text-xs font-medium">Serviço</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-purple-600">
        <ShoppingCart className="h-4 w-4" />
        <span className="text-xs font-medium">Produto</span>
      </div>
    );
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }, []);

  const formatDuration = useCallback((minutes?: number) => {
    if (!minutes) return "⏱️ Não definido";
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      return `📅 ${days} dia${days > 1 ? 's' : ''}`;
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `⏰ ${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `⏱️ ${minutes}min`;
  }, []);

  // Enhanced loading skeleton component
  const ItemSkeleton = () => (
    <Card className="glass-morphism">
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
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <Skeleton className="h-9 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
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

        <main className="flex-1 overflow-auto bg-gradient-to-br from-blue-50/30 to-purple-50/20">
          <div className="p-8 space-y-6">
            {/* Enhanced Page Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent flex items-center gap-4">
                  <div className="p-3 bg-gradient-primary rounded-2xl shadow-lg">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  Catálogo Especial 🐾
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gerencie seus produtos e serviços com carinho para pets e famílias
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    {displayStats.total} itens no catálogo
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {displayStats.favorites} favoritos
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatPrice(displayStats.revenue)} em produtos
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => updateFilters({ showFavoritesOnly: !filters.showFavoritesOnly })}
                  className={`glass-morphism ${filters.showFavoritesOnly ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : ''}`}
                >
                  <Star className={`h-4 w-4 mr-2 ${filters.showFavoritesOnly ? 'fill-current' : ''}`} />
                  Favoritos
                </Button>
                <Button
                  onClick={openCreateDialog}
                  className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg px-6 py-3"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Novo Item Especial
                </Button>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="glass-morphism hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 group-hover:scale-110 transition-transform">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      {isLoadingStats ? (
                        <Skeleton className="h-8 w-12 mb-1" />
                      ) : (
                        <p className="text-3xl font-bold text-blue-700">{displayStats.total}</p>
                      )}
                      <p className="text-sm text-muted-foreground font-medium">🎯 Total no Catálogo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      {isLoadingStats ? (
                        <Skeleton className="h-8 w-12 mb-1" />
                      ) : (
                        <p className="text-3xl font-bold text-purple-700">{displayStats.services}</p>
                      )}
                      <p className="text-sm text-muted-foreground font-medium">📅 Serviços Especiais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-3 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      {isLoadingStats ? (
                        <Skeleton className="h-8 w-12 mb-1" />
                      ) : (
                        <p className="text-3xl font-bold text-pink-700">{displayStats.products}</p>
                      )}
                      <p className="text-sm text-muted-foreground font-medium">🛒 Produtos Pet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 group-hover:scale-110 transition-transform">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      {isLoadingStats ? (
                        <Skeleton className="h-8 w-12 mb-1" />
                      ) : (
                        <p className="text-3xl font-bold text-yellow-700">{displayStats.favorites}</p>
                      )}
                      <p className="text-sm text-muted-foreground font-medium">⭐ Favoritos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Filters */}
            <Card className="glass-morphism">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                      🔍 Filtros Inteligentes
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFilters({ viewMode: filters.viewMode === 'grid' ? 'list' : 'grid' })}
                        className="glass-morphism"
                      >
                        {filters.viewMode === 'grid' ? (
                          <List className="h-4 w-4" />
                        ) : (
                          <Grid3X3 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="glass-morphism"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {showAdvancedFilters ? 'Menos' : 'Mais'} Filtros
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar produtos e serviços para pets... 🐾"
                        value={filters.search}
                        onChange={(e) => updateFilters({ search: e.target.value })}
                        className="pl-10 glass-morphism border-blue-200 focus:border-blue-400"
                      />
                    </div>

                    <Select value={filters.category} onValueChange={(value) => updateFilters({ category: value })}>
                      <SelectTrigger className="w-[200px] glass-morphism">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCategories ? (
                          <SelectItem value="loading" disabled>Buscando categorias... 🔍</SelectItem>
                        ) : (
                          categoriesForSelect.map((category) => (
                            <SelectItem key={category.slug} value={category.slug}>
                              {category.name} {category.count > 0 && `(${category.count})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
                      <SelectTrigger className="w-[180px] glass-morphism">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">🌟 Todos os status</SelectItem>
                        <SelectItem value="true">✅ Ativos</SelectItem>
                        <SelectItem value="false">⏸️ Pausados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showAdvancedFilters && (
                    <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-sm font-medium text-blue-700">Ordenar por:</span>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { value: 'name', label: 'Nome', icon: Tag },
                            { value: 'price', label: 'Preço', icon: DollarSign },
                            { value: 'category', label: 'Categoria', icon: Package },
                            { value: 'popular', label: 'Popularidade', icon: TrendingUp },
                          ].map(({ value, label, icon: Icon }) => (
                            <Button
                              key={value}
                              variant={filters.sortBy === value ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleSort(value as SortOption)}
                              className="text-xs"
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {label}
                              {filters.sortBy === value && (
                                filters.sortDirection === 'asc' ? (
                                  <SortAsc className="h-3 w-3 ml-1" />
                                ) : (
                                  <SortDesc className="h-3 w-3 ml-1" />
                                )
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Items Grid */}
            <div className={`gap-6 ${filters.viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'}`}>
              {isLoadingItems ? (
                // Show loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <ItemSkeleton key={`skeleton-${index}`} />
                ))
              ) : itemsError ? (
                // Show error state
                <div className="col-span-full text-center py-12">
                  <div className="p-6 bg-red-50 rounded-xl border border-red-200 max-w-md mx-auto">
                    <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-700 mb-2">Ops! Algo deu errado 🐾</h3>
                    <p className="text-red-600 mb-4">
                      Não conseguimos carregar os itens do catálogo. Vamos tentar novamente?
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="bg-red-50 hover:bg-red-100">
                      <Zap className="h-4 w-4 mr-2" />
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              ) : processedItems.length === 0 ? (
                // Show empty state
                <div className="col-span-full text-center py-12">
                  <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 max-w-lg mx-auto">
                    <Package className="h-20 w-20 text-blue-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-blue-700 mb-3">
                      {filters.search || filters.category !== "all" || filters.status !== "all" || filters.showFavoritesOnly
                        ? "Nenhum item encontrado 🔍"
                        : "Catálogo vazio 📦"}
                    </h3>
                    <p className="text-blue-600 mb-6">
                      {filters.search || filters.category !== "all" || filters.status !== "all" || filters.showFavoritesOnly
                        ? "Tente ajustar os filtros para encontrar itens especiais para pets."
                        : "Comece adicionando seus primeiros produtos e serviços para pets queridos."}
                    </p>
                    <div className="flex gap-3 justify-center">
                      {(filters.search || filters.category !== "all" || filters.status !== "all" || filters.showFavoritesOnly) && (
                        <Button
                          variant="outline"
                          onClick={() => setFilters({
                            search: "",
                            category: "all",
                            status: "all",
                            sortBy: "name",
                            sortDirection: "asc",
                            viewMode: "grid",
                            showFavoritesOnly: false,
                          })}
                          className="glass-morphism"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Limpar Filtros
                        </Button>
                      )}
                      <Button onClick={openCreateDialog} className="bg-gradient-primary hover:bg-gradient-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Item
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Show actual items
                processedItems.map((item) => (
                <Card
                  key={item.id}
                  className={`relative glass-morphism hover:shadow-lg transition-all duration-300 group ${
                    favoriteItems.has(item.id) ? 'ring-2 ring-yellow-200 bg-yellow-50/30' : ''
                  }`}
                >
                  {/* Item badges */}
                  <div className="absolute top-3 right-3 flex gap-2 z-10">
                    {item.popular && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/80 hover:bg-white"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          favoriteItems.has(item.id)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                      />
                    </Button>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        {getTypeIcon(item.requires_appointment)}
                        <div className="flex-1">
                          <CardTitle className="text-lg text-foreground group-hover:text-blue-700 transition-colors">
                            {item.name}
                          </CardTitle>
                          {getStatusBadge(item.is_active)}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-muted-foreground line-clamp-2">
                      {item.description || "Descrição não disponível"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Price and category */}
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                          {formatPrice(item.price)}
                        </span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          📁 {item.category}
                        </Badge>
                      </div>

                      {/* Service/Product specific info */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {item.requires_appointment ? (
                          <>
                            <div className="flex items-center gap-1 p-2 bg-blue-50 rounded-lg">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-700 font-medium">
                                {formatDuration(item.duration_minutes)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 p-2 bg-green-50 rounded-lg">
                              <Users className="h-4 w-4 text-green-600" />
                              <span className="text-green-700 font-medium">
                                {item.bookings || 0} agend.
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 p-2 bg-purple-50 rounded-lg">
                              <Package className="h-4 w-4 text-purple-600" />
                              <span className="text-purple-700 font-medium">
                                {item.stock || 0} estoque
                              </span>
                            </div>
                            <div className="flex items-center gap-1 p-2 bg-pink-50 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-pink-600" />
                              <span className="text-pink-700 font-medium">
                                {item.sales || 0} vendas
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 glass-morphism hover:bg-blue-50"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                          title="Visualizar detalhes"
                        >
                          <Eye className="h-4 w-4" />
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