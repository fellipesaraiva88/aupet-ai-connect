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
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Edit,
  Check,
  AlertCircle,
  Sparkles,
  PawPrint,
  Shield,
  Syringe,
  Activity,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  size: string; // NOVO: Porte do pet
  temperament: string; // NOVO: Temperamento
  is_neutered: boolean; // NOVO: Castrado
  is_vaccinated: boolean; // NOVO: Vacinado
  allergies: string; // NOVO: Alergias
  medical_notes: string; // NOVO: Observações médicas
  temp?: boolean;
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
    size: '',
    temperament: '',
    is_neutered: false,
    is_vaccinated: false,
    allergies: '',
    medical_notes: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const organizationId = useOrganizationId();
  const createCustomerMutation = useCreateCustomer();
  const createPetMutation = useCreatePet();

  // Máscara para telefone brasileira
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 10) {
      // Formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
      const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
      if (match) {
        let formatted = '';
        if (match[1]) formatted += `(${match[1]}`;
        if (match[1] && match[1].length === 2) formatted += ') ';
        if (match[2]) formatted += match[2];
        if (match[3]) formatted += `-${match[3]}`;
        return formatted;
      }
    } else {
      // Formato com 11 dígitos: (XX) 9XXXX-XXXX
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
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

  const validatePetFields = () => {
    const errors: Record<string, string> = {};

    if (!currentPet.name.trim()) {
      errors.name = "Nome é obrigatório";
    }
    if (!currentPet.species) {
      errors.species = "Selecione uma espécie";
    }
    if (!currentPet.size) {
      errors.size = "Selecione o porte";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addPet = () => {
    if (!validatePetFields()) {
      toast({
        title: "Campos obrigatórios faltando",
        description: "Preencha nome, espécie e porte do pet",
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
      size: '',
      temperament: '',
      is_neutered: false,
      is_vaccinated: false,
      allergies: '',
      medical_notes: ''
    });

    setValidationErrors({});

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

    console.log('Organization ID sendo usado:', organizationId);
    
    setLoading(true);
    try {
      // Criar o contato no WhatsApp
      const contactData = {
        name: familyData.owner.name,
        phone: familyData.owner.phone.replace(/\D/g, ''), // Remove formatação
        email: familyData.owner.email || undefined,
        notes: familyData.owner.notes || undefined,
        organization_id: organizationId,
      };

      console.log('Dados do contato:', contactData);

      const contact = await createCustomerMutation.mutateAsync(contactData);

      // Criar os pets com todos os novos campos
      const petsPromises = familyData.pets.map(pet =>
        createPetMutation.mutateAsync({
          name: pet.name,
          species: pet.species as 'cat' | 'dog' | 'bird' | 'fish' | 'hamster' | 'rabbit' | 'turtle' | 'other',
          breed: pet.breed || 'Não informado',
          birth_date: pet.age ? new Date(new Date().getFullYear() - parseInt(pet.age), 0, 1).toISOString().split('T')[0] : undefined,
          size: pet.size || undefined,
          temperament: pet.temperament || undefined,
          is_neutered: pet.is_neutered || false,
          is_vaccinated: pet.is_vaccinated || false,
          allergies: pet.allergies || undefined,
          medical_notes: pet.medical_notes || undefined,
          owner_id: contact.id,
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

      onFamilyCreated?.(contact);

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
      size: '',
      temperament: '',
      is_neutered: false,
      is_vaccinated: false,
      allergies: '',
      medical_notes: ''
    });
    setCurrentStep('owner');
    setShowPreview(false);
    setValidationErrors({});
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
          {/* Step Indicator - PREMIUM */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Step 1 */}
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep === 'owner'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                      : familyData.owner.name
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {familyData.owner.name ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${currentStep === 'owner' ? 'text-blue-900' : 'text-gray-600'}`}>
                      Dados da Família
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {familyData.owner.name || 'Nome e contato'}
                    </div>
                  </div>
                </div>

                {/* Connector */}
                <div className={`h-1 w-16 mx-4 rounded-full transition-all ${
                  familyData.owner.name ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gray-200'
                }`}></div>

                {/* Step 2 */}
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep === 'pets'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                      : familyData.pets.length > 0
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {familyData.pets.length > 0 ? familyData.pets.length : '2'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${currentStep === 'pets' ? 'text-blue-900' : 'text-gray-600'}`}>
                      Pets da Família
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {familyData.pets.length > 0 ? `${familyData.pets.length} pet(s) adicionado(s)` : 'Adicione os pets'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                  style={{
                    width: currentStep === 'owner'
                      ? '50%'
                      : familyData.pets.length > 0
                        ? '100%'
                        : '75%'
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

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

              {/* Current Pets - MELHORADO */}
              {familyData.pets.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Pets da Família ({familyData.pets.length})
                  </h3>
                  <div className="space-y-3">
                    {familyData.pets.map((pet) => (
                      <Card key={pet.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : pet.species === 'bird' ? '🐦' : pet.species === 'rabbit' ? '🐰' : pet.species === 'hamster' ? '🐹' : '🐠'}
                              </div>
                              <div>
                                <div className="font-semibold text-lg">{pet.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {pet.breed || 'Sem raça definida'}
                                  {pet.age && ` • ${pet.age} ${pet.age === '1' ? 'ano' : 'anos'}`}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePet(pet.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Badges com informações */}
                          <div className="flex flex-wrap gap-2">
                            {pet.size && (
                              <Badge variant="outline" className="text-xs">
                                <Activity className="h-3 w-3 mr-1" />
                                Porte: {
                                  pet.size === 'small' ? 'Pequeno' :
                                  pet.size === 'medium' ? 'Médio' :
                                  pet.size === 'large' ? 'Grande' : 'Gigante'
                                }
                              </Badge>
                            )}
                            {pet.temperament && (
                              <Badge variant="outline" className="text-xs">
                                {pet.temperament === 'calm' ? '😌' :
                                 pet.temperament === 'active' ? '⚡' :
                                 pet.temperament === 'anxious' ? '😰' :
                                 pet.temperament === 'aggressive' ? '😠' :
                                 pet.temperament === 'fearful' ? '😨' : '😊'}
                                {' '}
                                {pet.temperament === 'calm' ? 'Calmo' :
                                 pet.temperament === 'active' ? 'Ativo' :
                                 pet.temperament === 'anxious' ? 'Ansioso' :
                                 pet.temperament === 'aggressive' ? 'Agressivo' :
                                 pet.temperament === 'fearful' ? 'Medroso' : 'Amigável'}
                              </Badge>
                            )}
                            {pet.is_neutered && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Castrado
                              </Badge>
                            )}
                            {pet.is_vaccinated && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                <Syringe className="h-3 w-3 mr-1" />
                                Vacinado
                              </Badge>
                            )}
                          </div>

                          {/* Alergias */}
                          {pet.allergies && (
                            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-xs font-medium text-orange-900">Alergias:</div>
                                  <div className="text-xs text-orange-700">{pet.allergies}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Observações médicas */}
                          {pet.medical_notes && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-xs font-medium text-blue-900">Observações:</div>
                                  <div className="text-xs text-blue-700">{pet.medical_notes}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Add New Pet Form - REFATORADO */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Adicionar Pet
                  </h3>

                  <div className="space-y-4">
                    {/* Nome do Pet */}
                    <div>
                      <Label htmlFor="pet-name" className="flex items-center gap-2">
                        <PawPrint className="h-4 w-4" />
                        Nome do Pet *
                      </Label>
                      <Input
                        id="pet-name"
                        placeholder="Ex: Bolt, Luna, Thor..."
                        value={currentPet.name}
                        onChange={(e) => {
                          handlePetChange('name', e.target.value);
                          if (validationErrors.name) {
                            setValidationErrors(prev => ({ ...prev, name: '' }));
                          }
                        }}
                        className={`mt-1 ${validationErrors.name ? 'border-red-500' : currentPet.name ? 'border-green-500' : ''}`}
                      />
                      {validationErrors.name && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Espécie - Grid 3x2 */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4" />
                        Espécie *
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'dog', label: 'Cão', emoji: '🐕', color: 'hover:bg-blue-100' },
                          { value: 'cat', label: 'Gato', emoji: '🐱', color: 'hover:bg-orange-100' },
                          { value: 'bird', label: 'Ave', emoji: '🐦', color: 'hover:bg-green-100' },
                          { value: 'rabbit', label: 'Coelho', emoji: '🐰', color: 'hover:bg-pink-100' },
                          { value: 'hamster', label: 'Hamster', emoji: '🐹', color: 'hover:bg-yellow-100' },
                          { value: 'fish', label: 'Peixe', emoji: '🐠', color: 'hover:bg-cyan-100' },
                        ].map((species) => (
                          <Button
                            key={species.value}
                            type="button"
                            variant={currentPet.species === species.value ? "default" : "outline"}
                            size="lg"
                            onClick={() => {
                              handlePetChange('species', species.value);
                              if (validationErrors.species) {
                                setValidationErrors(prev => ({ ...prev, species: '' }));
                              }
                            }}
                            className={`h-auto py-3 flex flex-col gap-1 ${currentPet.species === species.value ? 'bg-primary' : species.color}`}
                          >
                            <span className="text-2xl">{species.emoji}</span>
                            <span className="text-xs">{species.label}</span>
                          </Button>
                        ))}
                      </div>
                      {validationErrors.species && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.species}
                        </p>
                      )}
                    </div>

                    {/* Raça e Idade */}
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
                        <Label htmlFor="pet-age">Idade</Label>
                        <Select
                          value={currentPet.age}
                          onValueChange={(value) => handlePetChange('age', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Filhote (&lt; 1 ano)</SelectItem>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year} {year === 1 ? 'ano' : 'anos'}
                              </SelectItem>
                            ))}
                            <SelectItem value="16">16+ anos (Idoso)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Porte - NOVO CAMPO IMPORTANTE */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Porte *
                      </Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {[
                          { value: 'small', label: 'Pequeno', desc: '< 10kg' },
                          { value: 'medium', label: 'Médio', desc: '10-25kg' },
                          { value: 'large', label: 'Grande', desc: '25-45kg' },
                          { value: 'giant', label: 'Gigante', desc: '> 45kg' },
                        ].map((size) => (
                          <Button
                            key={size.value}
                            type="button"
                            variant={currentPet.size === size.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              handlePetChange('size', size.value);
                              if (validationErrors.size) {
                                setValidationErrors(prev => ({ ...prev, size: '' }));
                              }
                            }}
                            className="h-auto py-2 flex flex-col gap-0.5"
                          >
                            <span className="text-xs font-semibold">{size.label}</span>
                            <span className="text-[10px] text-muted-foreground">{size.desc}</span>
                          </Button>
                        ))}
                      </div>
                      {validationErrors.size && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.size}
                        </p>
                      )}
                    </div>

                    {/* Temperamento - NOVO */}
                    <div>
                      <Label htmlFor="pet-temperament" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Temperamento
                      </Label>
                      <Select
                        value={currentPet.temperament}
                        onValueChange={(value) => handlePetChange('temperament', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Como é o comportamento?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="calm">😌 Calmo e tranquilo</SelectItem>
                          <SelectItem value="active">⚡ Ativo e brincalhão</SelectItem>
                          <SelectItem value="anxious">😰 Ansioso ou nervoso</SelectItem>
                          <SelectItem value="aggressive">😠 Agressivo ou territorial</SelectItem>
                          <SelectItem value="fearful">😨 Medroso</SelectItem>
                          <SelectItem value="friendly">😊 Sociável e amigável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Castrado e Vacinado - TOGGLES */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="font-medium text-sm">Castrado</div>
                                <div className="text-xs text-muted-foreground">Já foi castrado?</div>
                              </div>
                            </div>
                            <Switch
                              checked={currentPet.is_neutered}
                              onCheckedChange={(checked) => handlePetChange('is_neutered', checked as any)}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Syringe className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="font-medium text-sm">Vacinado</div>
                                <div className="text-xs text-muted-foreground">Vacinas em dia?</div>
                              </div>
                            </div>
                            <Switch
                              checked={currentPet.is_vaccinated}
                              onCheckedChange={(checked) => handlePetChange('is_vaccinated', checked as any)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Alergias - NOVO */}
                    <div>
                      <Label htmlFor="pet-allergies" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Alergias ou Restrições
                      </Label>
                      <Textarea
                        id="pet-allergies"
                        placeholder="Ex: Alergia a frango, intolerância à lactose, alergia a pulgas..."
                        value={currentPet.allergies}
                        onChange={(e) => handlePetChange('allergies', e.target.value)}
                        className="mt-1 resize-none"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Importante para personalizar o atendimento
                      </p>
                    </div>

                    {/* Observações Médicas - NOVO */}
                    <div>
                      <Label htmlFor="pet-medical">Observações Médicas</Label>
                      <Textarea
                        id="pet-medical"
                        placeholder="Ex: Tem displasia, toma medicação para coração, já teve cirurgia..."
                        value={currentPet.medical_notes}
                        onChange={(e) => handlePetChange('medical_notes', e.target.value)}
                        className="mt-1 resize-none"
                        rows={2}
                      />
                    </div>

                    <Button
                      onClick={addPet}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      size="lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Pet à Família
                    </Button>
                  </div>
                </CardContent>
              </Card>

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