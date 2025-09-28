import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Users,
  Stethoscope,
  Shield,
  Weight,
  PawPrint,
  MessageSquare,
  CalendarPlus,
  Activity,
  FileText,
} from "lucide-react";

interface DetailsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: any;
  onEdit: (entity: any) => void;
}

export function DetailsSidebar({ open, onOpenChange, entity, onEdit }: DetailsSidebarProps) {
  if (!entity) return null;

  const isCustomer = entity.type === 'customer';
  const data = entity.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isCustomer ? (
              <Users className="h-5 w-5" />
            ) : (
              <Heart className="h-5 w-5" />
            )}
            {entity.name}
          </SheetTitle>
          <SheetDescription>
            {isCustomer ? "Informações do cliente" : "Informações do pet"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-6">
            {/* Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {isCustomer ? entity.name?.charAt(0) : '🐾'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{entity.name}</h3>
                    {isCustomer ? (
                      <p className="text-muted-foreground">{data.email}</p>
                    ) : (
                      <p className="text-muted-foreground">{data.breed} • {data.age}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={entity.status === 'active' || entity.status === 'vip' ? 'default' : 'secondary'}>
                        {entity.status === 'vip' ? '⭐ VIP' : entity.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={() => onEdit(entity)} className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Conversar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            {isCustomer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="h-4 w-4" />
                    Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{data.phone}</span>
                    </div>
                  )}
                  {data.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{data.email}</span>
                    </div>
                  )}
                  {data.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{data.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pet Information */}
            {!isCustomer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4" />
                    Informações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Dono: {data.whatsapp_contacts?.name || 'Não informado'}</span>
                  </div>
                  {data.weight && (
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      <span>Peso: {data.weight}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Vacinação: {data.vaccination_status === 'up_to_date' ? '✅ Em dia' : '⚠️ Pendente'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pets for Customer */}
            {isCustomer && data.pets && data.pets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PawPrint className="h-4 w-4" />
                    Pets ({data.pets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.pets.map((pet: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="text-lg">🐾</div>
                        <div className="flex-1">
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-muted-foreground">{pet.species} • {pet.breed}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            {isCustomer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total gasto:</span>
                    <span className="font-medium">R$ {(data.total_spent || 0).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente desde:</span>
                    <span className="font-medium">{new Date(data.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pets cadastrados:</span>
                    <span className="font-medium">{data.pets?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarPlus className="h-4 w-4" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isCustomer ? (
                  <>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Serviço
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Histórico
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full justify-start">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Agendar Check-up
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Atualizar Vacinas
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Prontuário
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {data.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{data.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}