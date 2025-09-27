import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

const catalogItems = [
  {
    id: "1",
    name: "Banho e Tosa Completo",
    category: "Serviços",
    type: "service",
    price: 80.00,
    duration: 90,
    description: "Banho completo com shampoo especial, condicionador, secagem e tosa higiênica",
    popular: true,
    status: "active" as const,
    bookings: 45,
  },
  {
    id: "2",
    name: "Consulta Veterinária",
    category: "Serviços",
    type: "service",
    price: 120.00,
    duration: 45,
    description: "Consulta completa com exame físico e orientações",
    popular: true,
    status: "active" as const,
    bookings: 32,
  },
  {
    id: "3",
    name: "Ração Premium Golden",
    category: "Produtos",
    type: "product",
    price: 89.90,
    stock: 25,
    description: "Ração super premium para cães adultos - 15kg",
    popular: false,
    status: "active" as const,
    sales: 18,
  },
  {
    id: "4",
    name: "Vacinação V10",
    category: "Serviços",
    type: "service",
    price: 65.00,
    duration: 20,
    description: "Vacina múltipla V10 - proteção completa",
    popular: false,
    status: "active" as const,
    bookings: 28,
  },
  {
    id: "5",
    name: "Shampoo Anti-Pulgas",
    category: "Produtos",
    type: "product",
    price: 24.90,
    stock: 50,
    description: "Shampoo medicado para combate a pulgas e carrapatos",
    popular: false,
    status: "active" as const,
    sales: 12,
  },
  {
    id: "6",
    name: "Hospedagem Pet Hotel",
    category: "Serviços",
    type: "service",
    price: 45.00,
    duration: 1440, // 24 horas
    description: "Hospedagem completa com acompanhamento veterinário",
    popular: true,
    status: "active" as const,
    bookings: 15,
  },
  {
    id: "7",
    name: "Brinquedo Kong Classic",
    category: "Produtos",
    type: "product",
    price: 35.90,
    stock: 30,
    description: "Brinquedo resistente para cães de todos os portes",
    popular: false,
    status: "inactive" as const,
    sales: 8,
  },
];

const categories = ["Todos", "Serviços", "Produtos"];

const Catalog = () => {
  const activeMenuItem = useActiveNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredItems = catalogItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "Todos" || item.category === filterCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: catalogItems.length,
    services: catalogItems.filter(i => i.type === "service").length,
    products: catalogItems.filter(i => i.type === "product").length,
    popular: catalogItems.filter(i => i.popular).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="text-success">Ativo</Badge>;
      case "inactive":
        return <Badge variant="outline">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "service" ? (
      <Clock className="h-4 w-4 text-primary" />
    ) : (
      <Package className="h-4 w-4 text-secondary" />
    );
  };

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

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar ao Catálogo</DialogTitle>
                    <DialogDescription>
                      Adicione um novo produto ou serviço ao seu catálogo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome</label>
                        <Input placeholder="Nome do produto/serviço" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service">Serviço</SelectItem>
                            <SelectItem value="product">Produto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Categoria</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="servicos">Serviços</SelectItem>
                            <SelectItem value="produtos">Produtos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preço (R$)</label>
                        <Input type="number" placeholder="0,00" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Duração/Estoque</label>
                        <Input placeholder="90 min ou 25 unidades" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea
                        placeholder="Descrição detalhada do produto ou serviço"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline">Cancelar</Button>
                    <Button variant="default">Adicionar ao Catálogo</Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                      <p className="text-2xl font-bold">{stats.total}</p>
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
                      <p className="text-2xl font-bold">{stats.services}</p>
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
                      <p className="text-2xl font-bold">{stats.products}</p>
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
                      <p className="text-2xl font-bold">{stats.popular}</p>
                      <p className="text-sm text-muted-foreground">Populares</p>
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
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
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
              {filteredItems.map((item) => (
                <Card key={item.id} className="relative">
                  {item.popular && (
                    <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">
                      Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                      </div>
                      {getStatusBadge(item.status)}
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
                        {item.type === "service" ? (
                          <>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {item.duration >= 1440
                                ? `${item.duration / 1440} dia(s)`
                                : `${item.duration} min`
                              }
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {item.bookings} agendamentos
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              {item.stock} em estoque
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {item.sales} vendas
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <Button variant="outline" size="sm" className="flex-1 mr-2">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterCategory !== "Todos" || filterStatus !== "all"
                    ? "Tente ajustar os filtros para encontrar itens."
                    : "Comece adicionando seus primeiros produtos e serviços."}
                </p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Item
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Catalog;