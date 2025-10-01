import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useCustomers,
  usePets,
  useUpdateAppointment,
  useOrganizationId
} from "@/hooks/useApiData";
import {
  Calendar as CalendarIcon,
  Save,
  Loader2,
  Clock,
  DollarSign,
  User,
  Heart,
  Bell,
  AlertCircle,
  ArrowRight,
  PawPrint,
  Timer,
  MapPin,
  Edit3,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentEditDialogProps {
  appointment: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface AppointmentFormData {
  customer_id: string;
  pet_id: string;
  service_type: string;
  appointment_date: Date;
  appointment_time: string;
  price: number;
  notes: string;
  duration: number;
  priority: "low" | "normal" | "high" | "urgent";
  status: string;
  notify_customer: boolean;
}

const services = [
  { value: "banho-tosa", label: "🛁 Banho & Tosa", duration: 120, price: 85 },
  { value: "banho", label: "🛁 Banho", duration: 60, price: 40 },
  { value: "tosa", label: "✂️ Tosa", duration: 90, price: 50 },
  { value: "consulta", label: "🩺 Consulta", duration: 45, price: 120 },
  { value: "vacinacao", label: "💉 Vacinação", duration: 30, price: 65 },
  { value: "castracao", label: "⚕️ Castração", duration: 180, price: 300 },
  { value: "checkup", label: "📋 Check-up", duration: 45, price: 100 },
  { value: "emergencia", label: "🚨 Emergência", duration: 90, price: 250 },
  { value: "cirurgia", label: "🏥 Cirurgia", duration: 240, price: 500 },
  { value: "exame", label: "🔬 Exames", duration: 15, price: 80 },
  { value: "fisioterapia", label: "🤸 Fisioterapia", duration: 60, price: 90 },
  { value: "odontologia", label: "🦷 Odontologia", duration: 90, price: 150 },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

const statusOptions = [
  { value: "scheduled", label: "Agendado", color: "bg-blue-100 text-blue-700" },
  { value: "confirmed", label: "Confirmado", color: "bg-green-100 text-green-700" },
  { value: "pending", label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  { value: "completed", label: "Concluído", color: "bg-purple-100 text-purple-700" },
  { value: "cancelled", label: "Cancelado", color: "bg-red-100 text-red-700" },
];

export const AppointmentEditDialog: React.FC<AppointmentEditDialogProps> = ({
  appointment,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>({
    customer_id: "",
    pet_id: "",
    service_type: "",
    appointment_date: new Date(),
    appointment_time: "",
    price: 0,
    notes: "",
    duration: 60,
    priority: "normal",
    status: "scheduled",
    notify_customer: false,
  });
  const [originalData, setOriginalData] = useState<AppointmentFormData | null>(null);

  const organizationId = useOrganizationId();
  const { data: customers = [] } = useCustomers(organizationId);
  const { data: pets = [] } = usePets(organizationId);
  const updateAppointmentMutation = useUpdateAppointment();

  // Load appointment data when dialog opens
  useEffect(() => {
    if (appointment && open) {
      const appointmentDate = new Date(appointment.appointment_date);
      const data = {
        customer_id: appointment.customer_id || appointment.client_id || "",
        pet_id: appointment.pet_id || "",
        service_type: appointment.service_type || "",
        appointment_date: appointmentDate,
        appointment_time: appointmentDate.toTimeString().slice(0, 5),
        price: appointment.price || 0,
        notes: appointment.post_appointment_notes || appointment.notes || "",
        duration: appointment.duration_minutes || appointment.duration || 60,
        priority: appointment.priority || "normal",
        status: appointment.status || "scheduled",
        notify_customer: false,
      };
      setFormData(data);
      setOriginalData(data);
      setHasChanges(false);
    }
  }, [appointment, open]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);
  const customerPets = pets.filter(pet => (pet as any).owner_id === formData.customer_id);
  const selectedPet = customerPets.find(p => p.id === formData.pet_id);
  const selectedService = services.find(s => s.value === formData.service_type);
  const selectedStatus = statusOptions.find(s => s.value === formData.status);

  // Auto-update price and duration when service changes
  useEffect(() => {
    if (selectedService && hasChanges) {
      setFormData(prev => ({
        ...prev,
        price: selectedService.price,
        duration: selectedService.duration
      }));
    }
  }, [selectedService?.value]);

  const handleChange = (field: keyof AppointmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.pet_id || !formData.service_type || !formData.appointment_time) {
      toast({
        title: "Campos obrigatórios",
        description: "Cliente, pet, serviço e horário são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!appointment?.id) {
      toast({
        title: "Erro",
        description: "ID do agendamento não encontrado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const appointmentDateTime = new Date(formData.appointment_date);
      const [hours, minutes] = formData.appointment_time.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await updateAppointmentMutation.mutateAsync({
        id: appointment.id,
        updates: {
          customer_id: formData.customer_id,
          pet_id: formData.pet_id,
          service_type: formData.service_type,
          appointment_date: appointmentDateTime.toISOString(),
          price: formData.price,
          status: formData.status,
          duration_minutes: formData.duration,
          ...(formData.notes && { post_appointment_notes: formData.notes }),
        } as any,
      });

      toast({
        title: "✨ Agendamento atualizado!",
        description: formData.notify_customer
          ? `${selectedCustomer?.name} será notificado sobre as mudanças via WhatsApp.`
          : "As alterações foram salvas com sucesso.",
      });

      setHasChanges(false);
      onOpenChange(false);
      onSuccess?.();

    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm("Você tem alterações não salvas. Deseja realmente cancelar?");
      if (!confirm) return;
    }
    onOpenChange(false);
  };

  if (!appointment) return null;

  const getChangeSummary = () => {
    if (!originalData) return [];
    const changes: string[] = [];

    if (formData.service_type !== originalData.service_type) {
      const oldService = services.find(s => s.value === originalData.service_type);
      const newService = services.find(s => s.value === formData.service_type);
      changes.push(`Serviço: ${oldService?.label} → ${newService?.label}`);
    }

    if (formData.appointment_date.toDateString() !== originalData.appointment_date.toDateString() ||
        formData.appointment_time !== originalData.appointment_time) {
      changes.push(`Data/Hora: ${format(originalData.appointment_date, "dd/MM", { locale: ptBR })} ${originalData.appointment_time} → ${format(formData.appointment_date, "dd/MM", { locale: ptBR })} ${formData.appointment_time}`);
    }

    if (formData.price !== originalData.price) {
      changes.push(`Preço: R$ ${originalData.price} → R$ ${formData.price}`);
    }

    if (formData.status !== originalData.status) {
      const oldStatus = statusOptions.find(s => s.value === originalData.status);
      const newStatus = statusOptions.find(s => s.value === formData.status);
      changes.push(`Status: ${oldStatus?.label} → ${newStatus?.label}`);
    }

    return changes;
  };

  const changes = getChangeSummary();

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <Edit3 className="h-5 w-5" />
            </div>
            Editar Agendamento
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do agendamento e notifique o cliente sobre as mudanças
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Customer & Pet Info Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-white">
                    {selectedCustomer?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">{selectedCustomer?.name || 'Cliente não informado'}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <PawPrint className="h-3 w-3" />
                    {selectedPet?.name || 'Pet não informado'} • {selectedPet?.species || ''}
                  </div>
                </div>
                <Badge className={selectedStatus?.color}>
                  {selectedStatus?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Form - Two Columns */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => handleChange('customer_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pet Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <PawPrint className="h-4 w-4" />
                  Pet
                </Label>
                <Select
                  value={formData.pet_id}
                  onValueChange={(value) => handleChange('pet_id', value)}
                  disabled={!formData.customer_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerPets.map((pet: any) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name} ({pet.species})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Serviço
                </Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => handleChange('service_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolher serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{service.label}</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {service.duration}min • R${service.price}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Data
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.appointment_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.appointment_date ? format(formData.appointment_date, "dd 'de' MMMM", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.appointment_date}
                      onSelect={(date) => date && handleChange('appointment_date', date)}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário
                </Label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={formData.appointment_time === time ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => handleChange('appointment_time', time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Duração (min)
                  </Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observações</Label>
            <Textarea
              placeholder="Observações adicionais sobre o agendamento..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Notify Customer Toggle */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Notificar Cliente</div>
                    <div className="text-sm text-muted-foreground">
                      Enviar mensagem via WhatsApp sobre as alterações
                    </div>
                  </div>
                </div>
                <Switch
                  checked={formData.notify_customer}
                  onCheckedChange={(checked) => handleChange('notify_customer', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Changes Summary */}
          {hasChanges && changes.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 mb-2">Alterações detectadas:</div>
                    <ul className="space-y-1 text-sm text-blue-700">
                      {changes.map((change, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasChanges || loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
