import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  useCustomers, 
  usePets, 
  useCreateAppointment, 
  useOrganizationId 
} from "@/hooks/useApiData";
import {
  Calendar as CalendarIcon,
  Plus,
  Save,
  Loader2,
  Clock,
  DollarSign,
  User,
  Heart,
  Bell,
  CheckCircle,
  Sparkles,
  Phone,
  MessageSquare,
  Star,
  PawPrint,
  Zap,
  Timer,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentSidebarProps {
  onAppointmentCreated?: (appointment: any) => void;
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
  reminder_enabled: boolean;
}

const services = [
  { 
    value: "banho-tosa", 
    label: "Banho & Tosa", 
    emoji: "🛁", 
    duration: 120, 
    price: 85,
    category: "Express"
  },
  { 
    value: "consulta", 
    label: "Consulta", 
    emoji: "🩺", 
    duration: 45, 
    price: 120,
    category: "Saúde" 
  },
  { 
    value: "vacinacao", 
    label: "Vacinação", 
    emoji: "💉", 
    duration: 30, 
    price: 65,
    category: "Express" 
  },
  { 
    value: "emergencia", 
    label: "Emergência", 
    emoji: "🚨", 
    duration: 90, 
    price: 250,
    category: "Urgente" 
  },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

const quickActions = [
  { service: "banho-tosa", label: "Banho Rápido", time: "09:00" },
  { service: "consulta", label: "Consulta Express", time: "10:00" },
  { service: "vacinacao", label: "Vacina Rápida", time: "14:00" },
];

export const AppointmentSidebar: React.FC<AppointmentSidebarProps> = ({ 
  onAppointmentCreated 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
    reminder_enabled: true,
  });

  const organizationId = useOrganizationId();
  const { data: customers = [] } = useCustomers(organizationId);
  const { data: pets = [] } = usePets(organizationId);
  const createAppointmentMutation = useCreateAppointment();

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);
  const customerPets = pets.filter(pet => (pet as any).owner_id === formData.customer_id);
  const selectedService = services.find(s => s.value === formData.service_type);

  // Auto-update price and duration when service changes
  useEffect(() => {
    if (selectedService) {
      setFormData(prev => ({
        ...prev,
        price: selectedService.price,
        duration: selectedService.duration
      }));
    }
  }, [selectedService]);

  // Smart defaults based on customer history
  useEffect(() => {
    if (formData.customer_id && !formData.appointment_time) {
      // Auto-suggest 9am as default time
      setFormData(prev => ({ ...prev, appointment_time: "09:00" }));
    }
  }, [formData.customer_id]);

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setFormData(prev => ({
      ...prev,
      service_type: action.service,
      appointment_time: action.time
    }));
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

    setLoading(true);
    try {
      const appointmentDateTime = new Date(formData.appointment_date);
      const [hours, minutes] = formData.appointment_time.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await createAppointmentMutation.mutateAsync({
        client_id: formData.customer_id,
        pet_id: formData.pet_id,
        service_type: formData.service_type,
        appointment_date: appointmentDateTime.toISOString(),
        price: formData.price,
        notes: formData.notes,
        duration_minutes: formData.duration,
        organization_id: organizationId,
        status: 'scheduled' as any,
      } as any);

      toast({
        title: "✨ Agendado com sucesso!",
        description: `${selectedCustomer?.name} - ${selectedService?.label} em ${format(formData.appointment_date, "dd/MM", { locale: ptBR })} às ${formData.appointment_time}`,
      });

      resetForm();
      setOpen(false);
      onAppointmentCreated?.({});

    } catch (error) {
      toast({
        title: "Erro ao agendar",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      pet_id: "",
      service_type: "",
      appointment_date: new Date(),
      appointment_time: "",
      price: 0,
      notes: "",
      duration: 60,
      priority: "normal",
      reminder_enabled: true,
    });
    setSelectedDate(new Date());
  };

  const canSubmit = formData.customer_id && formData.pet_id && formData.service_type && formData.appointment_time;

  return (
    <Sheet open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <SheetTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
          <Zap className="h-4 w-4" />
          Agendar Rápido
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-full sm:w-[600px] overflow-y-auto bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            Agendamento Express
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Actions */}
          <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => {
                  const service = services.find(s => s.value === action.service);
                  return (
                    <Button
                      key={action.service}
                      variant="outline"
                      size="sm"
                      className="h-auto p-3 flex flex-col gap-1 hover:bg-primary/10 transition-colors"
                      onClick={() => handleQuickAction(action)}
                    >
                      <span className="text-lg">{service?.emoji}</span>
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Main Form - Two Columns */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
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
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, customer_id: value, pet_id: "" }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/20 text-xs">
                                  {customer.name?.charAt(0)?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              {customer.name}
                            </div>
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
                      onValueChange={(value) => setFormData(prev => ({ ...prev, pet_id: value }))}
                      disabled={!formData.customer_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={customerPets.length > 0 ? "Selecionar pet" : "Selecione um cliente primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {customerPets.map((pet: any) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{pet.species === 'dog' ? '🐕' : '🐱'}</span>
                              <span>{pet.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {pet.species === 'dog' ? 'Cão' : 'Gato'}
                              </Badge>
                            </div>
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
                      onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolher serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.value} value={service.value}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span>{service.emoji}</span>
                                <span>{service.label}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Timer className="h-3 w-3" />
                                {service.duration}min
                                <DollarSign className="h-3 w-3" />
                                R${service.price}
                              </div>
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
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            if (date) {
                              setFormData(prev => ({ ...prev, appointment_date: date }));
                            }
                          }}
                          disabled={(date) => date < new Date()}
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
                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={formData.appointment_time === time ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => setFormData(prev => ({ ...prev, appointment_time: time }))}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Price & Duration Display */}
                  {selectedService && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-primary">R$ {formData.price}</div>
                            <div className="text-xs text-muted-foreground">Valor</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-primary">{formData.duration}min</div>
                            <div className="text-xs text-muted-foreground">Duração</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Full Width Sections */}
              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Observações</Label>
                <Textarea
                  placeholder="Observações especiais para este agendamento..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Priority & Reminder */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prioridade</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Baixa</SelectItem>
                      <SelectItem value="normal">🟡 Normal</SelectItem>
                      <SelectItem value="high">🟠 Alta</SelectItem>
                      <SelectItem value="urgent">🔴 Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Lembrete WhatsApp
                  </Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Switch
                      checked={formData.reminder_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder_enabled: checked }))}
                    />
                    <Label className="text-sm">Enviar 1h antes</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? "Agendando..." : "Agendar"}
            </Button>
          </div>

          {/* Live Preview */}
          {canSubmit && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="text-sm">
                    <div className="font-medium text-green-800">
                      {selectedCustomer?.name} • {customerPets.find(p => p.id === formData.pet_id)?.name}
                    </div>
                    <div className="text-green-600">
                      {selectedService?.emoji} {selectedService?.label} • {format(formData.appointment_date, "dd/MM", { locale: ptBR })} às {formData.appointment_time}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};