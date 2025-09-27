import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";

const customers = [
  {
    id: "1",
    name: "Maria Silva",
    email: "maria.silva@email.com",
    phone: "+55 11 99999-1234",
    address: "Rua das Flores, 123 - São Paulo, SP",
    registeredAt: "2024-01-15",
    lastVisit: "2024-09-20",
    totalSpent: 1250.00,
    pets: [
      { name: "Luna", type: "Cachorro", breed: "Golden Retriever" },
      { name: "Milo", type: "Gato", breed: "Persa" }
    ],
    status: "active" as const,
    visits: 12,
  },
  {
    id: "2",
    name: "João Santos",
    email: "joao.santos@email.com",
    phone: "+55 11 99999-5678",
    address: "Av. Paulista, 456 - São Paulo, SP",
    registeredAt: "2024-02-10",
    lastVisit: "2024-09-18",
    totalSpent: 890.50,
    pets: [
      { name: "Buddy", type: "Cachorro", breed: "Labrador" }
    ],
    status: "active" as const,
    visits: 8,
  },
  {
    id: "3",
    name: "Ana Costa",
    email: "ana.costa@email.com",
    phone: "+55 11 99999-9012",
    address: "Rua do Comércio, 789 - São Paulo, SP",
    registeredAt: "2024-03-05",
    lastVisit: "2024-08-25",
    totalSpent: 450.00,
    pets: [
      { name: "Mimi", type: "Gato", breed: "Siamês" }
    ],
    status: "inactive" as const,
    visits: 3,
  },
  {
    id: "4",
    name: "Carlos Lima",
    email: "carlos.lima@email.com",
    phone: "+55 11 99999-3456",
    address: "Rua Central, 321 - São Paulo, SP",
    registeredAt: "2024-01-20",
    lastVisit: "2024-09-25",
    totalSpent: 2100.75,
    pets: [
      { name: "Rex", type: "Cachorro", breed: "Pastor Alemão" },
      { name: "Nina", type: "Cachorro", breed: "Bulldog" }
    ],
    status: "vip" as const,
    visits: 18,
  },
];

const Customers = () => {
  const [activeMenuItem] = useState("customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || customer.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === "active").length,
    vip: customers.filter(c => c.status === "vip").length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
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
          onItemClick={() => {}}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-primary font-bold tracking-tight text-primary flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  Clientes
                </h1>
                <p className="text-muted-foreground font-secondary">
                  Gerencie sua base de clientes com eficiência
                </p>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                    <DialogDescription>
                      Adicione um novo cliente ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome completo</label>
                      <Input placeholder="Ex: Maria Silva" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input type="email" placeholder="maria@email.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefone</label>
                        <Input placeholder="(11) 99999-9999" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Endereço</label>
                      <Input placeholder="Rua, número - Cidade, Estado" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline">Cancelar</Button>
                    <Button variant="default">Cadastrar Cliente</Button>
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
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-sm text-muted-foreground">Total Clientes</p>
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
                      <p className="text-2xl font-bold">{stats.active}</p>
                      <p className="text-sm text-muted-foreground">Clientes Ativos</p>
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
                      <p className="text-2xl font-bold">{stats.vip}</p>
                      <p className="text-sm text-muted-foreground">Clientes VIP</p>
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
                      <p className="text-2xl font-bold font-secondary">
                        R$ {stats.totalRevenue.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Receita Total</p>
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
                      Mostrando {filteredCustomers.length} de {customers.length} clientes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Pets</TableHead>
                      <TableHead>Visitas</TableHead>
                      <TableHead>Gasto Total</TableHead>
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
                                {customer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                Cliente desde {new Date(customer.registeredAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{customer.email}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.pets.map((pet, idx) => (
                              <div key={idx} className="flex items-center text-sm">
                                <Heart className="h-3 w-3 mr-1 text-primary" />
                                {pet.name} ({pet.type})
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{customer.visits}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-secondary font-bold text-primary">
                            R$ {customer.totalSpent.toLocaleString('pt-BR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(customer.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Tente ajustar os filtros para encontrar clientes."
                    : "Comece cadastrando seu primeiro cliente."}
                </p>
                <Button variant="outline">
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