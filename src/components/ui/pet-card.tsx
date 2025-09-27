import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  Heart, 
  Calendar, 
  Phone, 
  MapPin,
  MoreHorizontal,
  Stethoscope,
} from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  owner: string;
  ownerPhone: string;
  lastVisit: string;
  nextAppointment?: string;
  status: "active" | "inactive" | "needs_attention";
  photo?: string;
  vaccinated: boolean;
}

interface PetCardProps {
  pet: Pet;
  className?: string;
  onEdit?: (pet: Pet) => void;
  onSchedule?: (pet: Pet) => void;
  onContact?: (pet: Pet) => void;
}

const speciesEmojis: Record<string, string> = {
  dog: "🐕",
  cat: "🐱",
  bird: "🐦",
  rabbit: "🐰",
  fish: "🐠",
  hamster: "🐹",
  other: "🐾",
};

const statusStyles = {
  active: "border-success/20 bg-success/5",
  inactive: "border-muted/20 bg-muted/5",
  needs_attention: "border-warning/20 bg-warning/5",
};

export function PetCard({ 
  pet, 
  className, 
  onEdit, 
  onSchedule, 
  onContact 
}: PetCardProps) {
  const emoji = speciesEmojis[pet.species.toLowerCase()] || speciesEmojis.other;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-medium hover:-translate-y-1",
      statusStyles[pet.status],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={pet.photo} alt={pet.name} />
              <AvatarFallback className="bg-gradient-primary text-white text-lg">
                {emoji}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{pet.name}</h3>
              <p className="text-sm text-muted-foreground">
                {pet.breed} • {pet.age}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {pet.vaccinated && (
              <Badge variant="secondary" className="text-xs text-success">
                <Stethoscope className="h-3 w-3 mr-1" />
                Vacinado
              </Badge>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Heart className="h-4 w-4 mr-2" />
            <span>Peso: {pet.weight}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="h-4 w-4 mr-2" />
            <span>{pet.owner}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Última visita: {pet.lastVisit}</span>
          </div>

          {pet.nextAppointment && (
            <div className="flex items-center text-sm font-medium text-primary">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Próximo: {pet.nextAppointment}</span>
            </div>
          )}
        </div>

        {pet.status === "needs_attention" && (
          <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning-foreground">
              ⚠️ Precisa de atenção: Vacina em atraso
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(pet)}
          >
            Editar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => onSchedule?.(pet)}
          >
            Agendar
          </Button>
          <Button 
            variant="whatsapp" 
            size="sm"
            onClick={() => onContact?.(pet)}
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}