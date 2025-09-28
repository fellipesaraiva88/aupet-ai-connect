/**
 * KanbanBoard Component - Drag & Drop Board for Client/Pet Management
 *
 * Features:
 * - Responsive columns based on data type (customers/pets/mixed)
 * - Drag & drop functionality with visual feedback
 * - Animated cards with Framer Motion
 * - Contextual actions per card type
 * - Auto-grouping by status/category
 *
 * @component
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Users,
  Heart,
  Star,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Eye,
  Phone,
  Calendar,
  MessageSquare,
  MapPin,
  Stethoscope,
  Activity,
  Clock,
  PawPrint,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface KanbanItem {
  id: string;
  type: 'customer' | 'pet';
  name: string;
  status: string;
  data: any;
}

interface KanbanBoardProps {
  data: KanbanItem[];
  onEntityClick: (item: KanbanItem) => void;
  onEditCustomer: (customer: any) => void;
  onEditPet: (pet: any) => void;
}

const customerColumns = [
  {
    id: 'new',
    title: 'Novos Clientes',
    status: ['new', 'pending'],
    color: 'bg-blue-50 border-blue-200',
    icon: Users,
    iconColor: 'text-blue-600'
  },
  {
    id: 'active',
    title: 'Ativos',
    status: ['active'],
    color: 'bg-green-50 border-green-200',
    icon: Activity,
    iconColor: 'text-green-600'
  },
  {
    id: 'vip',
    title: 'VIP',
    status: ['vip'],
    color: 'bg-yellow-50 border-yellow-200',
    icon: Star,
    iconColor: 'text-yellow-600'
  },
  {
    id: 'inactive',
    title: 'Inativos',
    status: ['inactive'],
    color: 'bg-gray-50 border-gray-200',
    icon: Clock,
    iconColor: 'text-gray-600'
  },
];

const petColumns = [
  {
    id: 'healthy',
    title: 'Saudáveis',
    status: ['active', 'healthy'],
    color: 'bg-green-50 border-green-200',
    icon: Heart,
    iconColor: 'text-green-600'
  },
  {
    id: 'checkup',
    title: 'Check-up',
    status: ['checkup_due'],
    color: 'bg-blue-50 border-blue-200',
    icon: Stethoscope,
    iconColor: 'text-blue-600'
  },
  {
    id: 'vaccination',
    title: 'Vacinação',
    status: ['vaccination_due'],
    color: 'bg-purple-50 border-purple-200',
    icon: Activity,
    iconColor: 'text-purple-600'
  },
  {
    id: 'attention',
    title: 'Atenção',
    status: ['needs_attention', 'sick'],
    color: 'bg-red-50 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600'
  },
];

const speciesEmojis: Record<string, string> = {
  dog: "🐕",
  cat: "🐱",
  bird: "🐦",
  rabbit: "🐰",
  fish: "🐠",
  hamster: "🐹",
  other: "🐾",
};

export function KanbanBoard({ data, onEntityClick, onEditCustomer, onEditPet }: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null);

  // Determine which columns to show based on data types
  const hasCustomers = data.some(item => item.type === 'customer');
  const hasPets = data.some(item => item.type === 'pet');

  const columns = useMemo(() => {
    if (hasCustomers && !hasPets) return customerColumns;
    if (!hasCustomers && hasPets) return petColumns;

    // Mixed mode - show simplified columns
    return [
      {
        id: 'active',
        title: 'Ativos',
        status: ['active', 'healthy'],
        color: 'bg-green-50 border-green-200',
        icon: Activity,
        iconColor: 'text-green-600'
      },
      {
        id: 'vip',
        title: 'Especiais',
        status: ['vip'],
        color: 'bg-yellow-50 border-yellow-200',
        icon: Star,
        iconColor: 'text-yellow-600'
      },
      {
        id: 'attention',
        title: 'Precisam Atenção',
        status: ['needs_attention', 'vaccination_due', 'checkup_due'],
        color: 'bg-orange-50 border-orange-200',
        icon: AlertTriangle,
        iconColor: 'text-orange-600'
      },
      {
        id: 'inactive',
        title: 'Inativos',
        status: ['inactive'],
        color: 'bg-gray-50 border-gray-200',
        icon: Clock,
        iconColor: 'text-gray-600'
      },
    ];
  }, [hasCustomers, hasPets]);

  const getColumnItems = (columnStatuses: string[]) => {
    return data.filter(item => {
      // For unified view, we need special logic
      if (hasCustomers && hasPets) {
        if (item.type === 'customer') {
          return columnStatuses.includes(item.status);
        } else {
          // Map pet statuses to column statuses
          if (columnStatuses.includes('active') && item.data.is_active) return true;
          if (columnStatuses.includes('needs_attention') && !item.data.is_active) return true;
          if (columnStatuses.includes('vaccination_due') && item.data.vaccination_status === 'overdue') return true;
          return false;
        }
      }

      return columnStatuses.includes(item.status);
    });
  };

  const handleDragStart = (e: React.DragEvent, item: KanbanItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnStatus: string[]) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Here you would implement the logic to update the item's status
    console.log(`Moving ${draggedItem.name} to column with statuses:`, columnStatus);

    setDraggedItem(null);
  };

  const KanbanCard = ({ item }: { item: KanbanItem }) => {
    const isCustomer = item.type === 'customer';
    const data = item.data;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            "mb-3 cursor-pointer transition-all duration-200 hover:shadow-md group",
            draggedItem?.id === item.id && "opacity-50 scale-95"
          )}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragEnd={handleDragEnd}
          onClick={() => onEntityClick(item)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isCustomer ? (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {item.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="text-lg">
                    {speciesEmojis[data.species?.toLowerCase()] || speciesEmojis.other}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  {isCustomer ? (
                    <p className="text-xs text-muted-foreground truncate">
                      {data.email || 'Email não informado'}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground truncate">
                      {data.breed} • {data.age || 'Idade não informada'}
                    </p>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEntityClick(item);
                  }}>
                    <Eye className="h-3 w-3 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    if (isCustomer) {
                      onEditCustomer(data);
                    } else {
                      onEditPet(data);
                    }
                  }}>
                    <Edit className="h-3 w-3 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {isCustomer ? (
                    <>
                      <DropdownMenuItem>
                        <MessageSquare className="h-3 w-3 mr-2" />
                        Conversar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="h-3 w-3 mr-2" />
                        Agendar
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem>
                        <Stethoscope className="h-3 w-3 mr-2" />
                        Check-up
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="h-3 w-3 mr-2" />
                        Vacinar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              {isCustomer ? (
                <>
                  {data.phone && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 mr-1" />
                      <span className="truncate">{data.phone}</span>
                    </div>
                  )}
                  {data.pets && data.pets.length > 0 && (
                    <div className="flex items-center text-xs">
                      <PawPrint className="h-3 w-3 mr-1 text-primary" />
                      <span className="text-primary font-medium">
                        {data.pets.length} pet{data.pets.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {data.total_spent && data.total_spent > 0 && (
                    <div className="flex items-center text-xs text-success">
                      <span className="font-medium">
                        R$ {data.total_spent.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    <span className="truncate">{data.whatsapp_contacts?.name || 'Sem dono'}</span>
                  </div>
                  {data.weight && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>Peso: {data.weight}</span>
                    </div>
                  )}
                  {data.vaccination_status && (
                    <Badge
                      variant={data.vaccination_status === 'up_to_date' ? 'default' : 'destructive'}
                      className="text-xs px-2 py-0 h-5"
                    >
                      {data.vaccination_status === 'up_to_date' ? '✅ Vacinado' : '⚠️ Vacina pendente'}
                    </Badge>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <Badge
                variant={item.status === 'active' || item.status === 'vip' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {isCustomer ? (
                  item.status === 'vip' ? '⭐ VIP' :
                  item.status === 'active' ? 'Ativo' :
                  'Inativo'
                ) : (
                  data.is_active ? 'Saudável' : 'Atenção'
                )}
              </Badge>

              <span className="text-xs text-muted-foreground">
                {new Date(data.created_at || item.data.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-16rem)] overflow-x-auto pb-4">
      {columns.map((column) => {
        const items = getColumnItems(column.status);
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <Card className={cn("h-full", column.color)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className={cn("h-5 w-5", column.iconColor)} />
                  {column.title}
                  <Badge variant="secondary" className="ml-auto">
                    {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-[calc(100%-5rem)]">
                <ScrollArea className="h-full pr-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <KanbanCard key={`${item.type}-${item.id}`} item={item} />
                    ))}
                  </AnimatePresence>

                  {items.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum item</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}