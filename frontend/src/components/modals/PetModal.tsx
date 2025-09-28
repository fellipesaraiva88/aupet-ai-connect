import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCreatePet, useUpdatePet, useOrganizationId } from "@/hooks/useApiData";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, Stethoscope, Shield, User } from "lucide-react";

interface PetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet?: any;
  customers: any[];
  onClose: () => void;
}

interface PetFormData {
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  owner_id: string;
  medical_conditions: string;
  allergies: string;
  medications: string;
  vaccination_status: string;
  last_vaccination: string;
  next_vaccination: string;
  microchip_id: string;
  emergency_contact: string;
  special_notes: string;
}

export function PetModal({ open, onOpenChange, pet, customers, onClose }: PetModalProps) {
  const [activeStep, setActiveStep] = useState("basic");
  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
    owner_id: "",
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

  const organizationId = useOrganizationId();
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();
  const { toast } = useToast();

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || "",
        species: pet.species || "",
        breed: pet.breed || "",
        age: pet.age || "",
        weight: pet.weight || "",
        owner_id: pet.owner_id || "",
        medical_conditions: pet.medical_conditions || "",
        allergies: pet.allergies || "",
        medications: pet.medications || "",
        vaccination_status: pet.vaccination_status || "pending",
        last_vaccination: pet.last_vaccination || "",
        next_vaccination: pet.next_vaccination || "",
        microchip_id: pet.microchip_id || "",
        emergency_contact: pet.emergency_contact || "",
        special_notes: pet.special_notes || "",
      });
    } else {
      setFormData({
        name: "",
        species: "",
        breed: "",
        age: "",
        weight: "",
        owner_id: "",
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
    }
    setActiveStep("basic");
  }, [pet, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (pet) {
        await updatePetMutation.mutateAsync({
          id: pet.id,
          updates: formData,
        });
        toast({
          title: "Pet atualizado! 🐾",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        await createPetMutation.mutateAsync({
          ...formData,
          organization_id: organizationId,
          is_active: true,
        });
        toast({
          title: "Novo amiguinho! 🎉",
          description: "Pet cadastrado com muito carinho!",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Ops, algo não saiu como esperado",
        description: "Tente novamente em um momentinho.",
        variant: "destructive",
      });
    }
  };

  const isLoading = createPetMutation.isPending || updatePetMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pet ? "Editar Pet" : "Novo Amiguinho"}
          </DialogTitle>
          <DialogDescription>
            {pet ? "Atualize as informações do pet" : "Cadastre um novo pet na família"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Médico
              </TabsTrigger>
              <TabsTrigger value="vaccination" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vacinação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Proprietário *</Label>
                <Select value={formData.owner_id} onValueChange={(value) => setFormData({ ...formData, owner_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o proprietário" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {customer.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {customer.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Pet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Luna, Buddy..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="species">Espécie *</Label>
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breed">Raça</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="Ex: Golden Retriever"
                  />
                </div>
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
            </TabsContent>

            <TabsContent value="medical" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="medical_conditions">Condições Médicas</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  placeholder="Descreva condições médicas conhecidas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Liste alergias conhecidas..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Medicamentos</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  placeholder="Medicamentos em uso..."
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="vaccination" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="vaccination_status">Status da Vacinação</Label>
                <Select value={formData.vaccination_status} onValueChange={(value) => setFormData({ ...formData, vaccination_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {pet ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}