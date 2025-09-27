import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { PetCard } from "@/components/ui/pet-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  usePets,
  useCreatePet,
  useUpdatePet,
  useOrganizationId,
  useCustomers,
} from "@/hooks/useSupabaseData";
import {
  Heart,
  Search,
  Filter,
  Plus,
  Users,
  TrendingUp,
  Calendar,
  Stethoscope,
  Loader2,
} from "lucide-react";

type PetFormData = {
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  owner_id: string;
};

const Pets = () => {
  const activeMenuItem = useActiveNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
    owner_id: "",
  });

  const organizationId = useOrganizationId();
  const { data: pets = [], isLoading, error } = usePets(organizationId);
  const { data: customers = [] } = useCustomers(organizationId);
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();
  const { toast } = useToast();

  const filteredPets = pets.filter((pet) => {
    const ownerName = pet.whatsapp_contacts?.name || '';
    const matchesSearch = pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === "all" || pet.species === filterSpecies;
    const matchesStatus = filterStatus === "all" || pet.status === filterStatus;

    return matchesSearch && matchesSpecies && matchesStatus;
  });

  const stats = {
    total: pets.length,
    active: pets.filter(p => p.is_active).length,
    needsAttention: pets.filter(p => !p.is_active).length,
    vaccinated: pets.filter(p => p.vaccination_status === 'up_to_date').length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPet) {
        await updatePetMutation.mutateAsync({
          id: editingPet.id,
          updates: {
            name: formData.name,
            species: formData.species,
            breed: formData.breed,
            age: formData.age,
            weight: formData.weight,
            owner_id: formData.owner_id,
          },
        });
        toast({
          title: "Amiguinho cuidado! 🐾",
          description: "As informações do pet foram atualizadas para garantir o melhor cuidado possível.",
        });
      } else {
        await createPetMutation.mutateAsync({
          name: formData.name,
          species: formData.species,
          breed: formData.breed,
          age: formData.age,
          weight: formData.weight,
          owner_id: formData.owner_id,
          organization_id: organizationId,
          is_active: true,
        });
        toast({
          title: "Novo amiguinho na família! 🎉",
          description: "Que alegria conhecer este novo amiguinho! Estamos ansiosos para cuidar dele com muito amor.",
        });
      }
      setIsDialogOpen(false);
      setEditingPet(null);
      setFormData({ name: "", species: "", breed: "", age: "", weight: "", owner_id: "" });
    } catch (error) {
      toast({
        title: "Opa, precisamos de um minutinho",
        description: "Algo não saiu conforme esperado, mas não se preocupe! Vamos resolver juntos.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pet: any) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name || "",
      species: pet.species || "",
      breed: pet.breed || "",
      age: pet.age || "",
      weight: pet.weight || "",
      owner_id: pet.owner_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingPet(null);
    setFormData({ name: "", species: "", breed: "", age: "", weight: "", owner_id: "" });
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
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Heart className="h-8 w-8 text-primary" />
                  Nossos Amiguinhos Especiais
                </h1>
                <p className="text-muted-foreground font-secondary">
                  Cada pet é único e merece cuidado personalizado. Aqui está toda a família peluda que confia em nós.
                </p>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Conhecer Novo Amiguinho
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPet ? "Editar Amiguinho 🐾" : "Bem-vindo, novo amiguinho! 🐾"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPet ? "Atualize os dados do pet" : "Vamos conhecer melhor esse novo membro da família"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Pet</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Luna, Buddy..."
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="species">Espécie</Label>
                          <Select value={formData.species} onValueChange={(value) => setFormData({ ...formData, species: value })}>
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
                          <Label htmlFor="breed">Raça</Label>
                          <Input
                            id="breed"
                            value={formData.breed}
                            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                            placeholder="Ex: Golden Retriever"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="age">Idade</Label>
                          <Input
                            id="age"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            placeholder="Ex: 3 anos"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weight">Peso</Label>
                          <Input
                            id="weight"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="Ex: 28kg"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="owner">Proprietário</Label>
                        <Select value={formData.owner_id} onValueChange={(value) => setFormData({ ...formData, owner_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o proprietário" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createPetMutation.isPending || updatePetMutation.isPending}
                      >
                        {(createPetMutation.isPending || updatePetMutation.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {editingPet ? "Atualizar" : "Cadastrar"} com Carinho
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
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.total}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Amiguinhos Queridos</p>
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
                      <p className="text-sm text-muted-foreground">Cheios de Vida</p>
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
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.needsAttention}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Precisam de Atenção Extra</p>
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
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.vaccinated}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Protegidos com Amor</p>
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
                {isLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Mostrando {filteredPets.length} de {pets.length} pets
                  </span>
                )}
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
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-20 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Erro ao carregar pets</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={{
                      ...pet,
                      owner: pet.whatsapp_contacts?.name || 'Proprietário não informado',
                      ownerPhone: pet.whatsapp_contacts?.phone || '',
                    }}
                    onEdit={handleEdit}
                    onSchedule={(pet) => console.log("Schedule for pet:", pet)}
                    onContact={(pet) => console.log("Contact owner of pet:", pet)}
                  />
                ))}
              </div>
            )}

            {!isLoading && !error && filteredPets.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ainda não há pets aqui</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterSpecies !== "all" || filterStatus !== "all"
                    ? "Tente ajustar os filtros para encontrar seus amiguinhos."
                    : "Que tal começar cadastrando o primeiro pet que conquistou seu coração?"}
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
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