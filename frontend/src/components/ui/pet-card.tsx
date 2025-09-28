import React, { memo } from "react";
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
  Edit,
  CalendarPlus,
  MessageCircle
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
  photo_url?: string;
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

const PetCard = memo(function PetCard({
  pet,
  className,
  onEdit,
  onSchedule,
  onContact
}: PetCardProps) {
  const emoji = speciesEmojis[pet.species.toLowerCase()] || speciesEmojis.other;
  const petImage = pet.photo_url || pet.photo;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-medium hover:-translate-y-1 group",
      statusStyles[pet.status],
      className
    )}>
      <CardContent className="p-0">
        {/* Pet Image Header */}
        {petImage ? (
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={petImage}
              alt={pet.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 text-white">
                <div className="text-2xl">{emoji}</div>
                <div>
                  <h3 className="font-semibold text-lg">{pet.name}</h3>
                  <p className="text-sm opacity-90">
                    {pet.breed} • {pet.age}
                  </p>
                </div>
              </div>
            </div>
            {pet.vaccinated && (
              <Badge className="absolute top-3 right-3 bg-success text-white border-0">
                <Stethoscope className="h-3 w-3 mr-1" />
                Vacinado
              </Badge>
            )}
          </div>
        ) : (
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
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
              {pet.vaccinated && (
                <Badge variant="secondary" className="text-xs text-success">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  Vacinado
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 pt-4">
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Heart className="h-4 w-4 mr-2 text-primary" />
              <span>Peso: {pet.weight}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mr-2 text-primary" />
              <span className="truncate">{pet.owner}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
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

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 transition-all duration-200 hover:bg-primary hover:text-white"
              onClick={() => onEdit?.(pet)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={() => onSchedule?.(pet)}
            >
              <CalendarPlus className="h-4 w-4 mr-1" />
              Agendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 transition-all duration-200 hover:bg-green-600 hover:text-white hover:border-green-600"
              onClick={() => onContact?.(pet)}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export { PetCard };