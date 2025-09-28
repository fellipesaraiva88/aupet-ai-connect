import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Heart,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  MessageSquare,
  Star,
  PawPrint,
  Users,
  Stethoscope,
  Weight,
  Activity,
  Shield,
  Clock,
  CalendarPlus,
  MessageCircle,
  Trash,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";

interface UnifiedItem {
  id: string;
  type: 'customer' | 'pet';
  name: string;
  status: string;
  created_at: string;
  data: any;
  // Customer specific
  email?: string;
  phone?: string;
  pets?: any[];
  // Pet specific
  species?: string;
  breed?: string;
  owner?: string;
}

interface CustomerPetCardProps {
  item: UnifiedItem;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  className?: string;
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

const statusConfig = {
  customer: {
    active: { label: "Ativo", variant: "default" as const, color: "text-success" },
    vip: { label: "VIP", variant: "default" as const, color: "text-warning" },
    inactive: { label: "Inativo", variant: "secondary" as const, color: "text-muted-foreground" },
    new: { label: "Novo", variant: "default" as const, color: "text-primary" },
  },
  pet: {
    active: { label: "Saudável", variant: "default" as const, color: "text-success" },
    inactive: { label: "Atenção", variant: "destructive" as const, color: "text-destructive" },
    checkup_due: { label: "Check-up", variant: "secondary" as const, color: "text-warning" },
    vaccination_due: { label: "Vacina", variant: "destructive" as const, color: "text-destructive" },
  }
};

export function CustomerPetCard({
  item,
  selected = false,
  onSelect,
  onClick,
  onEdit,
  className
}: CustomerPetCardProps) {
  const isCustomer = item.type === 'customer';
  const data = item.data;

  const getStatusBadge = () => {
    const config = statusConfig[item.type as keyof typeof statusConfig];
    const statusInfo = config[item.status as keyof typeof config] || config.active;

    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {isCustomer && item.status === 'vip' && <Star className="h-3 w-3 mr-1" />}
        {statusInfo.label}
      </Badge>
    );
  };

  const handleSelectChange = (checked: boolean) => {
    onSelect?.(item.id, checked);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer",
          selected && "ring-2 ring-primary",
          isCustomer ? "border-blue-200 bg-blue-50/30" : "border-green-200 bg-green-50/30",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          {/* Selection checkbox and actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {onSelect && (
              <Checkbox
                checked={selected}
                onCheckedChange={handleSelectChange}
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {isCustomer ? (
                  <>
                    <DropdownMenuItem>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Conversar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Serviço
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Agendar Check-up
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="h-4 w-4 mr-2" />
                      Atualizar Vacinas
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Header with avatar/icon and basic info */}
          <div className="flex items-start gap-4 mb-4">
            {isCustomer ? (
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={data.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
                  {item.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-3xl ring-2 ring-green-200">
                {speciesEmojis[data.species?.toLowerCase()] || speciesEmojis.other}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate mb-1">
                {item.name || 'Nome não informado'}
              </h3>

              {isCustomer ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground truncate">
                    {data.email || 'Email não informado'}
                  </p>
                  <div className="flex items-center gap-4">
                    {getStatusBadge()}
                    <span className="text-xs text-muted-foreground">
                      Cliente desde {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {data.breed || 'Raça não informada'} • {data.age || 'Idade não informada'}
                  </p>
                  <div className="flex items-center gap-4">
                    {getStatusBadge()}
                    <span className="text-xs text-muted-foreground">
                      Desde {new Date(item.created_at || data.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content details */}
          <div className="space-y-3 mb-4">
            {isCustomer ? (
              <>
                {data.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    <span>{data.phone}</span>
                  </div>
                )}

                {data.address && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <span className="truncate">{data.address}</span>
                  </div>
                )}

                {data.pets && data.pets.length > 0 ? (
                  <div className="flex items-center text-sm">
                    <PawPrint className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-primary font-medium">
                      {data.pets.length} pet{data.pets.length !== 1 ? 's' : ''} cadastrado{data.pets.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <PawPrint className="h-4 w-4 mr-2" />
                    <span>Nenhum pet cadastrado</span>
                  </div>
                )}

                {data.total_spent && data.total_spent > 0 && (
                  <div className="flex items-center text-sm">
                    <ShoppingBag className="h-4 w-4 mr-2 text-success" />
                    <span className="text-success font-medium">
                      R$ {data.total_spent.toLocaleString('pt-BR')} investidos
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  <span>Dono: {data.whatsapp_contacts?.name || 'Não informado'}</span>
                </div>

                {data.weight && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Weight className="h-4 w-4 mr-2 text-primary" />
                    <span>Peso: {data.weight}</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  <span className={data.vaccination_status === 'up_to_date' ? 'text-success font-medium' : 'text-warning font-medium'}>
                    {data.vaccination_status === 'up_to_date' ? '✅ Vacinação em dia' : '⚠️ Vacinação pendente'}
                  </span>
                </div>

                {data.last_visit && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span>Última visita: {new Date(data.last_visit).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 transition-all duration-200 hover:bg-primary hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>

            {isCustomer ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 transition-all duration-200 hover:bg-green-600 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Conversar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Agendar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 transition-all duration-200 hover:bg-blue-600 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Stethoscope className="h-4 w-4 mr-1" />
                  Check-up
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Vacinar
                </Button>
              </>
            )}
          </div>

          {/* Special indicators */}
          {isCustomer && data.pets && data.pets.length > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                <Heart className="h-3 w-3 mr-1" />
                Com pets
              </Badge>
            </div>
          )}

          {!isCustomer && data.vaccination_status === 'overdue' && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Vacina atrasada
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}