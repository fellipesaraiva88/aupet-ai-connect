import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useCreateCustomer, useCreatePet, useOrganizationId } from "@/hooks/useSupabaseData";
import { 
  UserPlus, 
  Heart, 
  Plus, 
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Trash2,
  Edit
} from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  temp?: boolean; // Temporary pet before saving
}

interface FamilyData {
  owner: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  };
  pets: Pet[];
}

interface FamilySidebarProps {
  onFamilyCreated?: (family: any) => void;
}

export const FamilySidebar: React.FC<FamilySidebarProps> = ({ onFamilyCreated }) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'owner' | 'pets'>('owner');
  const [familyData, setFamilyData] = useState<FamilyData>({
    owner: {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    },
    pets: []
  });
  const [currentPet, setCurrentPet] = useState<Omit<Pet, 'id'>>({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: ''
  });
  const [loading, setLoading] = useState(false);

  const organizationId = useOrganizationId();
  const createCustomerMutation = useCreateCustomer();
  const createPetMutation = useCreatePet();

  // Máscara para telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{0,5})(\d{0,4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}${match[3] ? '-' + match[3] : ''}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFamilyData(prev => ({
      ...prev,
      owner: { ...prev.owner, phone: formatted }
    }));
  };

  const handleOwnerChange = (field: keyof FamilyData['owner'], value: string) => {
    setFamilyData(prev => ({
      ...prev,
      owner: { ...prev.owner, [field]: value }
    }));
  };

  const handlePetChange = (field: keyof typeof currentPet, value: string) => {
    setCurrentPet(prev => ({ ...prev, [field]: value }));
  };

  const addPet = () => {
    if (!currentPet.name || !currentPet.species) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e espécie do pet são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const newPet: Pet = {
      ...currentPet,
      id: `temp-${Date.now()}`,
      temp: true
    };

    setFamilyData(prev => ({
      ...prev,
      pets: [...prev.pets, newPet]
    }));

    setCurrentPet({
      name: '',
      species: '',
      breed: '',
      age: '',
      weight: ''
    });

    toast({
      title: "Pet adicionado! 🐾",
      description: `${newPet.name} foi adicionado à família`,
    });
  };

  const removePet = (petId: string) => {
    setFamilyData(prev => ({
      ...prev,
      pets: prev.pets.filter(pet => pet.id !== petId)
    }));
  };

  const handleContinueToStep2 = () => {
    if (!familyData.owner.name || !familyData.owner.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone da família são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep('pets');
  };

  const handleSaveFamily = async () => {
    if (familyData.pets.length === 0) {
      toast({
        title: "Adicione pelo menos um pet",
        description: "Uma família precisa ter pelo menos um amiguinho 🐾",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Criar o cliente/família
      const customerData = {
        name: familyData.owner.name,
        phone: familyData.owner.phone.replace(/\D/g, ''), // Remove formatação
        email: familyData.owner.email || undefined,
        notes: familyData.owner.notes || undefined,
        organization_id: organizationId,
      };

      const customer = await createCustomerMutation.mutateAsync(customerData);

      // Criar os pets
      const petsPromises = familyData.pets.map(pet => 
        createPetMutation.mutateAsync({
          name: pet.name,
          species: pet.species as 'cat' | 'dog' | 'bird' | 'fish' | 'hamster' | 'rabbit' | 'turtle' | 'other',
          breed: pet.breed || 'Não informado',
          birth_date: pet.age ? new Date(new Date().getFullYear() - parseInt(pet.age), 0, 1).toISOString().split('T')[0] : undefined,
          weight: pet.weight ? parseFloat(pet.weight) : undefined,
          owner_id: customer.id,
          organization_id: organizationId,
        })
      );

      await Promise.all(petsPromises);

      toast({
        title: "Família cadastrada com sucesso! 🎉",
        description: `${familyData.owner.name} e ${familyData.pets.length} pets foram cadastrados`,
      });

      // Reset form
      setFamilyData({
        owner: {
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: ''
        },
        pets: []
      });
      setCurrentStep('owner');
      setOpen(false);

      onFamilyCreated?.(customer);

    } catch (error) {
      console.error('Error creating family:', error);
      toast({
        title: "Erro ao cadastrar família",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFamilyData({
      owner: {
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      },
      pets: []
    });
    setCurrentPet({
      name: '',
      species: '',
      breed: '',
      age: '',
      weight: ''
    });
    setCurrentStep('owner');
  };

  return (
    <Sheet open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <SheetTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <UserPlus className="h-4 w-4" />
          Nova Família
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-pink-500" />
            Cadastrar Nova Família
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              currentStep === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <User className="h-4 w-4" />
              1. Família
            </div>
            <div className="w-8 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              currentStep === 'pets' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <Heart className="h-4 w-4" />
              2. Pets
            </div>
          </div>

          {currentStep === 'owner' && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <User className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold text-blue-900">Informações da Família</h3>
                <p className="text-sm text-blue-700">Cadastre primeiro os dados do responsável</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome do Responsável *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Maria Silva Santos"
                    value={familyData.owner.name}
                    onChange={(e) => handleOwnerChange('name', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={familyData.owner.phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="maria@email.com"
                    value={familyData.owner.email}
                    onChange={(e) => handleOwnerChange('email', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    placeholder="Rua, número, bairro, cidade"
                    value={familyData.owner.address}
                    onChange={(e) => handleOwnerChange('address', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre a família..."
                    value={familyData.owner.notes}
                    onChange={(e) => handleOwnerChange('notes', e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                onClick={handleContinueToStep2}
                className="w-full"
                size="lg"
              >
                Continuar para Pets
                <Heart className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {currentStep === 'pets' && (
            <div className="space-y-6">
              {/* Owner Summary */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {familyData.owner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-green-900">{familyData.owner.name}</h3>
                    <p className="text-sm text-green-700">{familyData.owner.phone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep('owner')}
                    className="ml-auto"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Current Pets */}
              {familyData.pets.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Pets da Família ({familyData.pets.length})
                  </h3>
                  <div className="space-y-2">
                    {familyData.pets.map((pet) => (
                      <div key={pet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{pet.name}</div>
                          <div className="text-sm text-gray-600">
                            {pet.species} {pet.breed && `• ${pet.breed}`}
                            {pet.age && ` • ${pet.age} anos`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePet(pet.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Add New Pet Form */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Pet
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pet-name">Nome do Pet *</Label>
                      <Input
                        id="pet-name"
                        placeholder="Ex: Bolt"
                        value={currentPet.name}
                        onChange={(e) => handlePetChange('name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pet-species">Espécie *</Label>
                      <Input
                        id="pet-species"
                        placeholder="Ex: Cão, Gato"
                        value={currentPet.species}
                        onChange={(e) => handlePetChange('species', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pet-breed">Raça</Label>
                      <Input
                        id="pet-breed"
                        placeholder="Ex: Golden Retriever"
                        value={currentPet.breed}
                        onChange={(e) => handlePetChange('breed', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pet-age">Idade (anos)</Label>
                      <Input
                        id="pet-age"
                        type="number"
                        placeholder="Ex: 3"
                        value={currentPet.age}
                        onChange={(e) => handlePetChange('age', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pet-weight">Peso (kg)</Label>
                    <Input
                      id="pet-weight"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 15.5"
                      value={currentPet.weight}
                      onChange={(e) => handlePetChange('weight', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button onClick={addPet} className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Pet
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleSaveFamily}
                  disabled={loading || familyData.pets.length === 0}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Família
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('owner')}
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};