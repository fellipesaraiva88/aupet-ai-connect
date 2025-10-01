import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useUpdatePet } from "@/hooks/useApiData";
import {
  Heart,
  MoreHorizontal,
  Edit,
  FileText,
  Trash2,
  Calendar,
  Weight,
  Cake,
  AlertCircle,
  Check,
  X
} from "lucide-react";

interface PetCardProps {
  pet: any;
  onEdit?: (pet: any) => void;
  onDelete?: (petId: string) => void;
  onViewHistory?: (pet: any) => void;
}

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  onEdit,
  onDelete,
  onViewHistory,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updatePetMutation = useUpdatePet();

  const getSpeciesEmoji = (species: string) => {
    const emojis: Record<string, string> = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      rabbit: '🐰',
      hamster: '🐹',
      fish: '🐠',
      reptile: '🦎',
      other: '🐾'
    };
    return emojis[species?.toLowerCase()] || '🐾';
  };

  const getSpeciesColor = (species: string) => {
    const colors: Record<string, string> = {
      dog: 'from-blue-400 to-blue-600',
      cat: 'from-orange-400 to-orange-600',
      bird: 'from-green-400 to-green-600',
      rabbit: 'from-pink-400 to-pink-600',
      hamster: 'from-yellow-400 to-yellow-600',
      fish: 'from-cyan-400 to-cyan-600',
      reptile: 'from-lime-400 to-lime-600',
      other: 'from-gray-400 to-gray-600'
    };
    return colors[species?.toLowerCase()] || 'from-gray-400 to-gray-600';
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageDate = new Date(ageInMs);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();

    if (years === 0) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        onDelete(pet.id);
      }

      toast({
        title: "Pet removido",
        description: `${pet.name} foi removido com sucesso.`,
      });

      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Erro ao remover pet",
        description: "Não foi possível remover o pet. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const age = calculateAge(pet.birth_date);

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-all duration-300 border-l-4 border-l-primary/30 group">
        <div className="flex items-start gap-4">
          {/* Avatar do Pet */}
          <div className="relative">
            <Avatar className={`h-14 w-14 ring-2 ring-white shadow-md bg-gradient-to-br ${getSpeciesColor(pet.species)}`}>
              {pet.photo_url ? (
                <AvatarImage src={pet.photo_url} alt={pet.name} />
              ) : (
                <AvatarFallback className="bg-transparent text-2xl">
                  {getSpeciesEmoji(pet.species)}
                </AvatarFallback>
              )}
            </Avatar>
            {pet.is_neutered && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Informações do Pet */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-foreground truncate">
                  {pet.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
                  {pet.breed && ` • ${pet.breed}`}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(pet)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Informações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewHistory?.(pet)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Histórico Médico
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Consulta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Pet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges e Informações */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant={pet.is_active ? "default" : "secondary"} className="text-xs">
                {pet.is_active ? "Ativo" : "Inativo"}
              </Badge>

              {pet.is_neutered && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Castrado
                </Badge>
              )}

              {age && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Cake className="h-3 w-3" />
                  {age}
                </Badge>
              )}

              {pet.weight && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Weight className="h-3 w-3" />
                  {pet.weight}kg
                </Badge>
              )}

              {pet.gender && (
                <Badge variant="outline" className="text-xs">
                  {pet.gender === 'male' ? 'Macho' : pet.gender === 'female' ? 'Fêmea' : 'Indefinido'}
                </Badge>
              )}
            </div>

            {/* Informações Adicionais */}
            {(pet.allergies?.length > 0 || pet.medications?.length > 0 || pet.special_needs) && (
              <div className="mt-3 pt-3 border-t space-y-1">
                {pet.allergies?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Alergias: {pet.allergies.join(', ')}</span>
                  </div>
                )}

                {pet.medications?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Heart className="h-3 w-3" />
                    <span>{pet.medications.length} medicamento(s) em uso</span>
                  </div>
                )}

                {pet.special_needs && (
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Necessidades especiais</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Remover {pet.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pet <strong>{pet.name}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, remover pet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
