import React, { useState } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useOrganizationId,
} from "@/hooks/useSupabaseData";
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
} from "lucide-react";

type CustomerFormData = {
  name: string;
  email: string;
  phone: string;
  address?: string;
};

const Customers = () => {
  const activeMenuItem = useActiveNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const organizationId = useOrganizationId();
  const { data: customers = [], isLoading, error } = useCustomers(organizationId);
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const { toast } = useToast();

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || customer.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === "active").length,
    vip: customers.filter(c => c.status === "vip").length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
  };

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
          organization_id: organizationId,
        });
        toast({
          title: "Nova família acolhida! 🏠",
          description: "Que alegria ter vocês conosco! Estamos prontos para cuidar com muito carinho.",
        });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormData({ name: "", email: "", phone: "", address: "" });
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
    });
    setIsDialogOpen(true);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData({ name: "", email: "", phone: "", address: "" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="text-success">Ativo</Badge>;
      case "vip":
        return <Badge className="bg-secondary text-secondary-foreground">VIP</Badge>;
      case "inactive":
        return <Badge variant="outline">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
                  <Users className="h-8 w-8" />
                  Famílias que Confiaram em Você
                </h1>
                <p className="text-muted-foreground font-secondary">
                  Cada cliente é uma família que escolheu cuidar dos seus pets conosco. Vamos honrar essa confiança juntos.
                </p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Acolher Nova Família
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
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.total}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Famílias Cuidadas</p>
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
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.active}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Sempre Presentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-secondary/10 p-3">
                      <User className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.vip}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Famílias Especiais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-warning/10 p-3">
                      <TrendingUp className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      {isLoading ? (
                        <Skeleton className="h-8 w-20 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold font-secondary">
                          R$ {stats.totalRevenue.toLocaleString('pt-BR')}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">Confiança Investida</p>
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
                      placeholder="Buscar por nome, email ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
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

            {/* Customers Table */}
            <Card>
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