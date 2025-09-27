import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { PetCard } from "@/components/ui/pet-card";
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
import {
  Heart,
  Search,
  Filter,
  Plus,
  Users,
  TrendingUp,
  Calendar,
  Stethoscope,
} from "lucide-react";

const pets = [
  {
    id: "1",
    name: "Luna",
    species: "dog",
    breed: "Golden Retriever",
    age: "3 anos",
    weight: "28kg",
    owner: "Maria Silva",
    ownerPhone: "+55 11 99999-1234",
    lastVisit: "15 dias atrás",
    nextAppointment: "Amanhã, 14:00",
    status: "active" as const,
    vaccinated: true,
  },
  {
    id: "2",
    name: "Buddy",
    species: "dog",
    breed: "Labrador",
    age: "5 anos",
    weight: "32kg",
    owner: "João Santos",
    ownerPhone: "+55 11 99999-5678",
    lastVisit: "1 semana atrás",
    status: "active" as const,
    vaccinated: true,
  },
  {
    id: "3",
    name: "Mimi",
    species: "cat",
    breed: "Persa",
    age: "2 anos",
    weight: "4kg",
    owner: "Ana Costa",
    ownerPhone: "+55 11 99999-9012",
    lastVisit: "3 semanas atrás",
    status: "needs_attention" as const,
    vaccinated: false,
  },
  {
    id: "4",
    name: "Rex",
    species: "dog",
    breed: "Pastor Alemão",
    age: "4 anos",
    weight: "35kg",
    owner: "Carlos Lima",
    ownerPhone: "+55 11 99999-3456",
    lastVisit: "2 dias atrás",
    status: "active" as const,
    vaccinated: true,
  },
  {
    id: "5",
    name: "Nala",
    species: "cat",
    breed: "Siamês",
    age: "1 ano",
    weight: "3kg",
    owner: "Fernanda Rocha",
    ownerPhone: "+55 11 99999-7890",
    lastVisit: "1 mês atrás",
    status: "active" as const,
    vaccinated: true,
  },
  {
    id: "6",
    name: "Thor",
    species: "dog",
    breed: "Rottweiler",
    age: "6 anos",
    weight: "45kg",
    owner: "Ricardo Mendes",
    ownerPhone: "+55 11 99999-2468",
    lastVisit: "4 meses atrás",
    status: "inactive" as const,
    vaccinated: true,
  },
];

const Pets = () => {
  const [activeMenuItem] = useState("pets");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredPets = pets.filter((pet) => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === "all" || pet.species === filterSpecies;
    const matchesStatus = filterStatus === "all" || pet.status === filterStatus;
    
    return matchesSearch && matchesSpecies && matchesStatus;
  });

  const stats = {
    total: pets.length,
    active: pets.filter(p => p.status === "active").length,
    needsAttention: pets.filter(p => p.status === "needs_attention").length,
    vaccinated: pets.filter(p => p.vaccinated).length,
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
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Heart className="h-8 w-8 text-primary" />
                  Pets Queridos
                </h1>
                <p className="text-muted-foreground">
                  Cada pet tem uma história especial conosco 💙
                </p>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="hero" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Amiguinho
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bem-vindo, novo amiguinho! 🐾</DialogTitle>
                    <DialogDescription>
                      Vamos conhecer melhor esse novo membro da família
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Pet</label>
                      <Input placeholder="Ex: Luna, Buddy..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Espécie</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dog">Cachorro</SelectItem>
                            <SelectItem value="cat">Gato</SelectItem>
                            <SelectItem value="bird">Pássaro</SelectItem>
                            <SelectItem value="rabbit">Coelho</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Raça</label>
                        <Input placeholder="Ex: Golden Retriever" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Idade</label>
                        <Input placeholder="Ex: 3 anos" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Peso</label>
                        <Input placeholder="Ex: 28kg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dono</label>
                      <Input placeholder="Nome do proprietário" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline">Cancelar</Button>
                    <Button variant="default">Cadastrar com Carinho</Button>
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
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-sm text-muted-foreground">Total de Pets</p>
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
                      <p className="text-sm text-muted-foreground">Pets Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-warning/10 p-3">
                      <Calendar className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.needsAttention}</p>
                      <p className="text-sm text-muted-foreground">Precisam de Carinho</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-secondary/10 p-3">
                      <Stethoscope className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.vaccinated}</p>
                      <p className="text-sm text-muted-foreground">Vacinados</p>
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
                      placeholder="Buscar por nome do pet ou dono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todas as espécies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as espécies</SelectItem>
                      <SelectItem value="dog">🐕 Cachorros</SelectItem>
                      <SelectItem value="cat">🐱 Gatos</SelectItem>
                      <SelectItem value="bird">🐦 Pássaros</SelectItem>
                      <SelectItem value="rabbit">🐰 Coelhos</SelectItem>
                      <SelectItem value="other">🐾 Outros</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="needs_attention">Precisam Atenção</SelectItem>
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

            {/* Results Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Mostrando {filteredPets.length} de {pets.length} pets
                </span>
                {(searchTerm || filterSpecies !== "all" || filterStatus !== "all") && (
                  <Badge variant="secondary">
                    Filtrando resultados
                  </Badge>
                )}
              </div>
              
              <Select defaultValue="recent">
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                  <SelectItem value="owner">Por dono</SelectItem>
                  <SelectItem value="species">Por espécie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pets Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onEdit={(pet) => console.log("Edit pet:", pet)}
                  onSchedule={(pet) => console.log("Schedule for pet:", pet)}
                  onContact={(pet) => console.log("Contact owner of pet:", pet)}
                />
              ))}
            </div>

            {filteredPets.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ainda não há pets aqui</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterSpecies !== "all" || filterStatus !== "all"
                    ? "Tente ajustar os filtros para encontrar seus amiguinhos."
                    : "Que tal começar cadastrando o primeiro pet que conquistou seu coração?"}
                </p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Amiguinho
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Pets;