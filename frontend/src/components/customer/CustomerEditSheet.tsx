import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useUpdateCustomer, useDeleteCustomer } from "@/hooks/useApiData";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Heart,
  Save,
  Loader2,
  Trash2,
  Star,
  MessageSquare,
  ShoppingBag,
  AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PetCard } from "@/components/pet/PetCard";
import { AddPetDialog } from "@/components/pet/AddPetDialog";

interface CustomerEditSheetProps {
  customer: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerEditSheet: React.FC<CustomerEditSheetProps> = ({
  customer,
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    status: "active",
    preferredContact: "whatsapp",
    birthDate: "",
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        notes: customer.internal_notes || customer.notes || "",
        status: customer.status || "active",
        preferredContact: customer.preferred_contact_method || "whatsapp",
        birthDate: customer.birth_date || "",
      });
    }
  }, [customer]);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 10) {
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
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }

    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!customer) return;

    try {
      await updateCustomerMutation.mutateAsync({
        id: customer.id,
        updates: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          ...(formData.notes && { internal_notes: formData.notes }),
          status: formData.status,
          ...(formData.preferredContact && { preferred_contact_method: formData.preferredContact }),
          ...(formData.birthDate && { birth_date: formData.birthDate }),
        },
      });

      toast({
        title: "Família atualizada com sucesso! 💝",
        description: "As informações foram salvas com carinho.",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      await deleteCustomerMutation.mutateAsync(customer.id);

      toast({
        title: "Família removida",
        description: "O cliente foi removido com sucesso.",
      });

      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Ativo</Badge>;
      case "vip":
        return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none">
          <Star className="h-3 w-3 mr-1" />
          VIP
        </Badge>;
      case "inactive":
        return <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!customer) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[600px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                  {customer.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-2xl">{customer.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(customer.status || 'active')}
                  <Badge variant="outline" className="text-xs">
                    Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-4">
              <TabsTrigger value="general" className="gap-2">
                <User className="h-4 w-4" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="pets" className="gap-2">
                <Heart className="h-4 w-4" />
                Pets
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <FileText className="h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Ações
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 py-4">
              {/* Aba Geral */}
              <TabsContent value="general" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="mt-1"
                      placeholder="Nome do cliente"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="mt-1"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
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
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="mt-1"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="mt-1"
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birthDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data de Nascimento
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleChange('birthDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="preferredContact">Contato Preferido</Label>
                      <Select
                        value={formData.preferredContact}
                        onValueChange={(value) => handleChange('preferredContact', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status do Cliente</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Observações Internas
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      className="mt-1 resize-none"
                      rows={4}
                      placeholder="Anotações sobre o cliente..."
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Aba Pets */}
              <TabsContent value="pets" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    Pets da Família ({customer.pets?.length || 0})
                  </h3>
                  <AddPetDialog customerId={customer.id} />
                </div>

                {customer.pets && customer.pets.length > 0 ? (
                  <div className="space-y-3">
                    {customer.pets.map((pet: any) => (
                      <PetCard key={pet.id} pet={pet} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="font-medium mb-2">Nenhum pet cadastrado</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione o primeiro pet desta família
                    </p>
                    <AddPetDialog customerId={customer.id} />
                  </div>
                )}
              </TabsContent>

              {/* Aba Histórico */}
              <TabsContent value="history" className="mt-0 space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <ShoppingBag className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Gasto</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        R$ {(customer.total_spent || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Agendamentos</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {customer.appointments?.length || 0}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Atividade Recente</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}</p>
                      {customer.updated_at && (
                        <p>• Última atualização: {new Date(customer.updated_at).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba Ações */}
              <TabsContent value="actions" className="mt-0 space-y-3">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <MessageSquare className="h-4 w-4" />
                  Iniciar Conversa no WhatsApp
                </Button>

                <Button className="w-full justify-start gap-2" variant="outline">
                  <Calendar className="h-4 w-4" />
                  Agendar Atendimento
                </Button>

                <Button className="w-full justify-start gap-2" variant="outline">
                  <FileText className="h-4 w-4" />
                  Ver Histórico Completo
                </Button>

                <Separator />

                <Button
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover Cliente
                </Button>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer com botões de ação */}
          <div className="border-t p-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={updateCustomerMutation.isPending}
            >
              {updateCustomerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente <strong>{customer.name}</strong> será removido permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, remover cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
