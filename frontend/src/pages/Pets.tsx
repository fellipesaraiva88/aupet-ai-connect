import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { PetCard } from "@/components/ui/pet-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PetCardSkeleton, StatCardSkeleton } from "@/components/ui/optimized-skeleton";
import { ResponsiveLayouts, ResponsiveContainer } from "@/components/ui/responsive-grid";
import { EmptyStates, PetFeedback } from "@/components/ui/feedback";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  usePets,
  useCreatePet,
  useUpdatePet,
  useOrganizationId,
  useCustomers,
} from "@/hooks/useApiData";
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
  Camera,
  FileText,
  Activity,
  Shield,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Weight,
  Ruler,
  Dog,
  Cat,
  Bird,
} from "lucide-react";

type PetFormData = {
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  owner_id: string;
  photo?: File | null;
  // Prontuário médico
  medical_conditions?: string;
  allergies?: string;
  medications?: string;
  vaccination_status?: string;
  last_vaccination?: string;
  next_vaccination?: string;
  microchip_id?: string;
  emergency_contact?: string;
  special_notes?: string;
};

const Pets = () => {
  const activeMenuItem = useActiveNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProntuarioOpen, setIsProntuarioOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
    owner_id: "",
    photo: null,
    medical_conditions: "",
    allergies: "",
    medications: "",
    vaccination_status: "pending",
    last_vaccination: "",
    next_vaccination: "",
    microchip_id: "",
    emergency_contact: "",
    special_notes: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const organizationId = useOrganizationId();
  const { data: pets = [], isLoading, error } = usePets(organizationId);
  const { data: customers = [] } = useCustomers(organizationId);
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();
  const { toast } = useToast();

  // Memoize filtered pets for performance
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const ownerName = pet.whatsapp_contacts?.name || '';
      const matchesSearch = pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecies = filterSpecies === "all" || pet.species === filterSpecies;
      const matchesStatus = filterStatus === "all" || pet.status === filterStatus;

      return matchesSearch && matchesSpecies && matchesStatus;
    });
  }, [pets, searchTerm, filterSpecies, filterStatus]);

  // Memoize stats for performance
  const stats = useMemo(() => ({
    total: pets.length,
    active: pets.filter(p => p.is_active).length,
    needsAttention: pets.filter(p => !p.is_active).length,
    vaccinated: pets.filter(p => p.vaccination_status === 'up_to_date').length,
  }), [pets]);

  // Upload photo function
  const uploadPhoto = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploadingPhoto(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', 'pet_photo');

      // Simulated upload - replace with actual API call
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);

        // Create a preview URL for now
        const photoUrl = URL.createObjectURL(file);
        setPhotoPreview(photoUrl);

        setTimeout(() => {
          setUploadingPhoto(false);
          setUploadProgress(0);
          resolve(photoUrl);
        }, 500);
      }, 2000);
    });
  };

  const handleFileSelect = async (file: File) => {
    try {
      const photoUrl = await uploadPhoto(file);
      setFormData(prev => ({ ...prev, photo: file }));
    } catch (error) {
      toast({
        title: "Ops, algo deu errado",
        description: "Não conseguimos enviar a foto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleFileRemove = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview("");
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
      setFormData({
        name: "",
        species: "",
        breed: "",
        age: "",
        weight: "",
        owner_id: "",
        photo: null,
        medical_conditions: "",
        allergies: "",
        medications: "",
        vaccination_status: "pending",
        last_vaccination: "",
        next_vaccination: "",
        microchip_id: "",
        emergency_contact: "",
        special_notes: "",
      });
      setPhotoPreview("");
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
      photo: null,
    });
    setPhotoPreview(pet.photo_url || "");
    setIsDialogOpen(true);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingPet(null);
    setFormData({
      name: "",
      species: "",
      breed: "",
      age: "",
      weight: "",
      owner_id: "",
      photo: null,
      medical_conditions: "",
      allergies: "",
      medications: "",
      vaccination_status: "pending",
      last_vaccination: "",
      next_vaccination: "",
      microchip_id: "",
      emergency_contact: "",
      special_notes: "",
    });
    setPhotoPreview("");
  };

  const handleViewProntuario = (pet: any) => {
    setSelectedPet(pet);
    setIsProntuarioOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeItem={activeMenuItem}
        />
        
        <main className="flex-1 overflow-auto">
          <ResponsiveContainer className="py-8 space-y-6">
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPet ? "Editar Amiguinho 🐾" : "Bem-vindo, novo amiguinho! 🐾"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPet ? "Atualize os dados e prontuário médico do pet" : "Vamos conhecer melhor esse novo membro da família e criar seu prontuário"}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic" className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Dados Básicos
                        </TabsTrigger>
                        <TabsTrigger value="medical" className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          Prontuário Médico
                        </TabsTrigger>
                        <TabsTrigger value="vaccination" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Vacinação
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4 mt-4">
                        {/* Photo Upload Section */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Foto do Pet
                          </Label>
                          <FileUpload
                            onFileSelect={handleFileSelect}
                            onFileRemove={handleFileRemove}
                            preview={photoPreview}
                            uploading={uploadingPhoto}
                            uploadProgress={uploadProgress}
                            placeholder="Adicione uma foto deste amiguinho especial"
                            className="w-full max-w-xs mx-auto"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="species">Espécie</Label>
                            <Select value={formData.species} onValueChange={(value) => setFormData({ ...formData, species: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dog">🐕 Cachorro</SelectItem>
                                <SelectItem value="cat">🐱 Gato</SelectItem>
                                <SelectItem value="bird">🐦 Pássaro</SelectItem>
                                <SelectItem value="rabbit">🐰 Coelho</SelectItem>
                                <SelectItem value="hamster">🐹 Hamster</SelectItem>
                                <SelectItem value="other">🐾 Outro</SelectItem>
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

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="age" className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Idade
                            </Label>
                            <Input
                              id="age"
                              value={formData.age}
                              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                              placeholder="Ex: 3 anos"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="weight" className="flex items-center gap-2">
                              <Weight className="h-4 w-4" />
                              Peso
                            </Label>
                            <Input
                              id="weight"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="Ex: 28kg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="microchip">Microchip</Label>
                            <Input
                              id="microchip"
                              value={formData.microchip_id}
                              onChange={(e) => setFormData({ ...formData, microchip_id: e.target.value })}
                              placeholder="ID do microchip"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="medical" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="medical_conditions" className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Condições Médicas
                            </Label>
                            <Textarea
                              id="medical_conditions"
                              value={formData.medical_conditions}
                              onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                              placeholder="Descreva condições médicas conhecidas, histórico de cirurgias, etc."
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="allergies" className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Alergias
                            </Label>
                            <Textarea
                              id="allergies"
                              value={formData.allergies}
                              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                              placeholder="Liste alergias conhecidas (alimentos, medicamentos, etc.)"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="medications" className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Medicamentos em Uso
                            </Label>
                            <Textarea
                              id="medications"
                              value={formData.medications}
                              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                              placeholder="Liste medicamentos que o pet toma regularmente"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                            <Input
                              id="emergency_contact"
                              value={formData.emergency_contact}
                              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                              placeholder="Nome e telefone do veterinário de emergência"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="special_notes">Observações Especiais</Label>
                            <Textarea
                              id="special_notes"
                              value={formData.special_notes}
                              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                              placeholder="Informações importantes sobre comportamento, cuidados especiais, etc."
                              rows={3}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="vaccination" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="vaccination_status">Status da Vacinação</Label>
                            <Select value={formData.vaccination_status} onValueChange={(value) => setFormData({ ...formData, vaccination_status: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="up_to_date">✅ Em dia</SelectItem>
                                <SelectItem value="pending">⏳ Pendente</SelectItem>
                                <SelectItem value="overdue">🚨 Atrasada</SelectItem>
                                <SelectItem value="unknown">❓ Desconhecido</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="last_vaccination">Última Vacinação</Label>
                              <Input
                                id="last_vaccination"
                                type="date"
                                value={formData.last_vaccination}
                                onChange={(e) => setFormData({ ...formData, last_vaccination: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="next_vaccination">Próxima Vacinação</Label>
                              <Input
                                id="next_vaccination"
                                type="date"
                                value={formData.next_vaccination}
                                onChange={(e) => setFormData({ ...formData, next_vaccination: e.target.value })}
                              />
                            </div>
                          </div>

                          <Card className="p-4 bg-blue-50 border-blue-200">
                            <div className="flex items-start gap-3">
                              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-blue-900">Lembretes de Vacinação</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                  Mantenha sempre o calendário de vacinação atualizado para garantir a proteção do seu amiguinho.
                                  Receberá notificações automáticas quando a próxima dose estiver próxima.
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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
                        {editingPet ? "Salvar Alterações" : "Cadastrar"} com Carinho
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Dialog do Prontuário Médico */}
              <Dialog open={isProntuarioOpen} onOpenChange={setIsProntuarioOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Prontuário Médico - {selectedPet?.name}
                    </DialogTitle>
                    <DialogDescription>
                      Histórico médico completo e informações de saúde do pet
                    </DialogDescription>
                  </DialogHeader>

                  {selectedPet && (
                    <div className="space-y-6">
                      {/* Informações Básicas */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Informações Básicas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">NOME</Label>
                              <p className="font-semibold">{selectedPet.name}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">ESPÉCIE</Label>
                              <p className="font-semibold capitalize">{selectedPet.species}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">RAÇA</Label>
                              <p className="font-semibold">{selectedPet.breed || 'Não informada'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">IDADE</Label>
                              <p className="font-semibold">{selectedPet.age || 'Não informada'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Status de Vacinação */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Status de Vacinação
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <Badge variant={selectedPet.vaccination_status === 'up_to_date' ? 'default' : 'destructive'}>
                              {selectedPet.vaccination_status === 'up_to_date' ? '✅ Em dia' : '⚠️ Verificar vacinação'}
                            </Badge>
                            {selectedPet.last_vaccination && (
                              <span className="text-sm text-muted-foreground">
                                Última: {new Date(selectedPet.last_vaccination).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Histórico de Consultas */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Histórico de Consultas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-semibold">Check-up Anual</p>
                                <p className="text-sm text-muted-foreground">15 de março, 2024</p>
                              </div>
                              <Badge>Concluído</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-semibold">Vacinação V10</p>
                                <p className="text-sm text-muted-foreground">10 de janeiro, 2024</p>
                              </div>
                              <Badge>Concluído</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Botões de Ação */}
                      <div className="flex gap-3">
                        <Button onClick={() => handleEdit(selectedPet)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Editar Prontuário
                        </Button>
                        <Button variant="outline">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Agendar Consulta
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <ResponsiveLayouts.Stats>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <Heart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.total}</p>
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
                          <p className="text-2xl font-bold">{stats.active}</p>
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
                          <p className="text-2xl font-bold">{stats.needsAttention}</p>
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
                          <p className="text-2xl font-bold">{stats.vaccinated}</p>
                          <p className="text-sm text-muted-foreground">Protegidos com Amor</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </ResponsiveLayouts.Stats>

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
              <ResponsiveLayouts.Cards>
                {Array.from({ length: 6 }).map((_, index) => (
                  <PetCardSkeleton key={index} />
                ))}
              </ResponsiveLayouts.Cards>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Erro ao carregar pets</p>
              </div>
            ) : (
              <ResponsiveLayouts.Cards>
                {filteredPets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={{
                      ...pet,
                      owner: pet.whatsapp_contacts?.name || 'Proprietário não informado',
                      ownerPhone: pet.whatsapp_contacts?.phone || '',
                      lastVisit: pet.last_visit || 'Nunca visitou',
                    }}
                    onEdit={handleEdit}
                    onSchedule={(pet) => console.log("Schedule for pet:", pet)}
                    onContact={(pet) => console.log("Contact owner of pet:", pet)}
                    onViewProntuario={handleViewProntuario}
                  />
                ))}
              </ResponsiveLayouts.Cards>
            )}

            {!isLoading && !error && filteredPets.length === 0 && (
              searchTerm || filterSpecies !== "all" || filterStatus !== "all" ? (
                <EmptyStates.SearchNoResults />
              ) : (
                <EmptyStates.NoPets onAddPet={() => setIsDialogOpen(true)} />
              )
            )}
          </ResponsiveContainer>
        </main>
      </div>
    </div>
  );
};

export default Pets;