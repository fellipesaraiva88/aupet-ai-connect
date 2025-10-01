import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useCreatePet, useOrganizationId } from "@/hooks/useApiData";
import {
  Plus,
  Heart,
  Loader2,
  Calendar,
  Weight,
  FileText,
  Syringe,
  AlertTriangle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddPetDialogProps {
  customerId: string;
  trigger?: React.ReactNode;
}

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Cão', emoji: '🐕', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300' },
  { value: 'cat', label: 'Gato', emoji: '🐱', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300' },
  { value: 'bird', label: 'Ave', emoji: '🐦', color: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300' },
  { value: 'rabbit', label: 'Coelho', emoji: '🐰', color: 'bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-300' },
  { value: 'hamster', label: 'Hamster', emoji: '🐹', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300' },
  { value: 'fish', label: 'Peixe', emoji: '🐠', color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-300' },
  { value: 'reptile', label: 'Réptil', emoji: '🦎', color: 'bg-lime-100 text-lime-700 hover:bg-lime-200 border-lime-300' },
  { value: 'other', label: 'Outro', emoji: '🐾', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300' },
];

export const AddPetDialog: React.FC<AddPetDialogProps> = ({ customerId, trigger }) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    color: "",
    gender: "unknown",
    birth_date: "",
    weight: "",
    microchip_number: "",
    special_needs: "",
    allergies: [] as string[],
    is_neutered: false,
    notes: "",
  });
  const [allergyInput, setAllergyInput] = useState("");

  const organizationId = useOrganizationId();
  const createPetMutation = useCreatePet();

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()]
      }));
      setAllergyInput("");
    }
  };

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.species) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e espécie do pet são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPetMutation.mutateAsync({
        customer_id: customerId,
        name: formData.name,
        species: formData.species as any,
        breed: formData.breed || undefined,
        color: formData.color || undefined,
        gender: formData.gender as any,
        birth_date: formData.birth_date || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        microchip_number: formData.microchip_number || undefined,
        special_needs: formData.special_needs || undefined,
        allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
        is_neutered: formData.is_neutered,
      } as any);

      toast({
        title: "Pet cadastrado com sucesso! 🐾",
        description: `${formData.name} foi adicionado à família`,
      });

      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating pet:', error);
      toast({
        title: "Erro ao cadastrar pet",
        description: "Não foi possível cadastrar o pet. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      species: "",
      breed: "",
      color: "",
      gender: "unknown",
      birth_date: "",
      weight: "",
      microchip_number: "",
      special_needs: "",
      allergies: [],
      is_neutered: false,
      notes: "",
    });
    setCurrentStep(1);
    setAllergyInput("");
  };

  const selectedSpecies = SPECIES_OPTIONS.find(s => s.value === formData.species);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
            <Plus className="h-4 w-4" />
            Adicionar Pet
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-pink-500" />
            Adicionar Novo Pet
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo amiguinho para esta família
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 my-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            currentStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="font-medium">1</span>
            Básico
          </div>
          <div className="w-8 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="font-medium">2</span>
            Saúde
          </div>
        </div>

        {/* Step 1: Informações Básicas */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Seleção de Espécie */}
            <div>
              <Label className="mb-3 block">Espécie do Pet *</Label>
              <div className="grid grid-cols-4 gap-2">
                {SPECIES_OPTIONS.map((species) => (
                  <button
                    key={species.value}
                    type="button"
                    onClick={() => handleChange('species', species.value)}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1
                      ${formData.species === species.value
                        ? 'border-primary bg-primary/10 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="text-2xl">{species.emoji}</span>
                    <span className="text-xs font-medium">{species.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedSpecies && (
              <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
                <span className="text-2xl">{selectedSpecies.emoji}</span>
                <span className="font-medium">
                  Cadastrando um {selectedSpecies.label.toLowerCase()}
                </span>
              </div>
            )}

            <Separator />

            {/* Nome e Raça */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Pet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Bolt, Luna, Bob"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="breed">Raça</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => handleChange('breed', e.target.value)}
                  placeholder="Ex: Golden Retriever"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Cor e Sexo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  placeholder="Ex: Preto, Branco, Caramelo"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gender">Sexo</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Fêmea</SelectItem>
                    <SelectItem value="unknown">Não informado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data de Nascimento e Peso */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Nascimento
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleChange('birth_date', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Peso (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  placeholder="Ex: 15.5"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Castrado */}
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Checkbox
                id="is_neutered"
                checked={formData.is_neutered}
                onCheckedChange={(checked) => handleChange('is_neutered', checked)}
              />
              <label
                htmlFor="is_neutered"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Pet castrado
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Informações de Saúde */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Microchip */}
            <div>
              <Label htmlFor="microchip_number">Número do Microchip</Label>
              <Input
                id="microchip_number"
                value={formData.microchip_number}
                onChange={(e) => handleChange('microchip_number', e.target.value)}
                placeholder="15 dígitos hexadecimais"
                className="mt-1 font-mono"
                maxLength={15}
              />
            </div>

            {/* Alergias */}
            <div>
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alergias
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  placeholder="Ex: Frango, Pólen"
                />
                <Button type="button" onClick={addAllergy} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.allergies.map((allergy, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-amber-100 text-amber-700 gap-1"
                    >
                      {allergy}
                      <button
                        onClick={() => removeAllergy(index)}
                        className="ml-1 hover:text-amber-900"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Necessidades Especiais */}
            <div>
              <Label htmlFor="special_needs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Necessidades Especiais
              </Label>
              <Textarea
                id="special_needs"
                value={formData.special_needs}
                onChange={(e) => handleChange('special_needs', e.target.value)}
                placeholder="Descreva qualquer necessidade especial do pet..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="notes">Observações Gerais</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Outras informações importantes sobre o pet..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          {currentStep === 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
            >
              Voltar
            </Button>
          )}

          {currentStep === 1 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!formData.name || !formData.species}
            >
              Próximo: Informações de Saúde
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createPetMutation.isPending}
              className="gap-2"
            >
              {createPetMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  Cadastrar Pet
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
