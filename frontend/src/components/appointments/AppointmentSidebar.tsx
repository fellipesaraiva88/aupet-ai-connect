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
  MapPin,
  Bell,
  Settings,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Timer,
  Phone,
  MessageSquare,
  Star,
  PawPrint,
  Zap
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
  location: string;
  reminder_enabled: boolean;
  preparation_notes: string;
  follow_up_needed: boolean;
}

type StepType = "client" | "service" | "schedule" | "details" | "review";

const services = [
  { 
    value: "banho-tosa", 
    label: "Banho & Tosa Completa", 
    emoji: "🛁", 
    duration: 120, 
    price: 85,
    description: "Banho relaxante + tosa profissional",
    category: "Estética"
  },
  { 
    value: "banho", 
    label: "Banho Terapêutico", 
    emoji: "🫧", 
    duration: 60, 
    price: 45,
    description: "Banho com produtos especiais",
    category: "Estética" 
  },
  { 
    value: "tosa", 
    label: "Tosa Criativa", 
    emoji: "✂️", 
    duration: 90, 
    price: 55,
    description: "Corte personalizado para seu pet",
    category: "Estética" 
  },
  { 
    value: "consulta", 
    label: "Consulta Veterinária", 
    emoji: "🩺", 
    duration: 45, 
    price: 120,
    description: "Avaliação completa de saúde",
    category: "Saúde" 
  },
  { 
    value: "vacinacao", 
    label: "Vacinação", 
    emoji: "💉", 
    duration: 30, 
    price: 65,
    description: "Proteção e imunização",
    category: "Saúde" 
  },
  { 
    value: "checkup", 
    label: "Check-up Premium", 
    emoji: "📋", 
    duration: 60, 
    price: 150,
    description: "Avaliação completa + exames",
    category: "Saúde" 
  },
  { 
    value: "emergencia", 
    label: "Atendimento de Emergência", 
    emoji: "🚨", 
    duration: 90, 
    price: 250,
    description: "Atendimento prioritário 24h",
    category: "Emergência" 
  },
  { 
    value: "cirurgia", 
    label: "Procedimento Cirúrgico", 
    emoji: "🏥", 
    duration: 180, 
    price: 450,
    description: "Cirurgia com acompanhamento",
    category: "Cirurgia" 
  },
];

const timeSlots = [
  { time: "08:00", label: "8:00", period: "Manhã" },
  { time: "08:30", label: "8:30", period: "Manhã" },
  { time: "09:00", label: "9:00", period: "Manhã" },
  { time: "09:30", label: "9:30", period: "Manhã" },
  { time: "10:00", label: "10:00", period: "Manhã" },
  { time: "10:30", label: "10:30", period: "Manhã" },
  { time: "11:00", label: "11:00", period: "Manhã" },
  { time: "11:30", label: "11:30", period: "Manhã" },
  { time: "14:00", label: "14:00", period: "Tarde" },
  { time: "14:30", label: "14:30", period: "Tarde" },
  { time: "15:00", label: "15:00", period: "Tarde" },
  { time: "15:30", label: "15:30", period: "Tarde" },
  { time: "16:00", label: "16:00", period: "Tarde" },
  { time: "16:30", label: "16:30", period: "Tarde" },
  { time: "17:00", label: "17:00", period: "Tarde" },
  { time: "17:30", label: "17:30", period: "Tarde" },
];

export const AppointmentSidebar: React.FC<AppointmentSidebarProps> = ({ 
  onAppointmentCreated 
}) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>("client");
  const [loading, setLoading] = useState(false);
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
    location: "Clínica Principal",
    reminder_enabled: true,
    preparation_notes: "",
    follow_up_needed: false,
  });

  const organizationId = useOrganizationId();
  const { data: customers = [] } = useCustomers(organizationId);
  const { data: pets = [] } = usePets(organizationId);
  const createAppointmentMutation = useCreateAppointment();

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);
  const customerPets = pets.filter(pet => (pet as any).owner_id === formData.customer_id);
  const selectedPet = pets.find(p => p.id === formData.pet_id);
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

  const stepConfig: Record<StepType, { 
    title: string; 
    description: string; 
    icon: React.ReactNode;
    gradient: string;
  }> = {
    client: {
      title: "Cliente & Pet",
      description: "Escolha quem receberá nosso carinho",
      icon: <User className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-400"
    },
    service: {
      title: "Serviço",
      description: "Que tipo de cuidado especial?",
      icon: <Heart className="h-5 w-5" />,
      gradient: "from-pink-500 to-rose-400"
    },
    schedule: {
      title: "Data & Hora",
      description: "Quando será este momento especial?",
      icon: <Calendar className="h-5 w-5" />,
      gradient: "from-purple-500 to-violet-400"
    },
    details: {
      title: "Detalhes",
      description: "Personalize o atendimento",
      icon: <Settings className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-400"
    },
    review: {
      title: "Revisão",
      description: "Tudo pronto para o agendamento!",
      icon: <CheckCircle className="h-5 w-5" />,
      gradient: "from-amber-500 to-orange-400"
    }
  };

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case "client":
        return Boolean(formData.customer_id && formData.pet_id);
      case "service":
        return Boolean(formData.service_type);
      case "schedule":
        return Boolean(formData.appointment_date && formData.appointment_time);
      case "details":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const steps: StepType[] = ["client", "service", "schedule", "details", "review"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: StepType[] = ["client", "service", "schedule", "details", "review"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
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
        title: "✨ Momento especial agendado!",
        description: `${selectedPet?.name} terá seu momento de cuidado em ${format(formData.appointment_date, "dd 'de' MMMM", { locale: ptBR })} às ${formData.appointment_time}`,
      });

      resetForm();
      setOpen(false);
      onAppointmentCreated?.({});

    } catch (error) {
      toast({
        title: "Ops! Algo deu errado",
        description: "Não conseguimos agendar agora, mas vamos tentar novamente!",
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
      location: "Clínica Principal",
      reminder_enabled: true,
      preparation_notes: "",
      follow_up_needed: false,
    });
    setCurrentStep("client");
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: { color: "bg-gray-100 text-gray-700", icon: "📅" },
      normal: { color: "bg-blue-100 text-blue-700", icon: "📋" },
      high: { color: "bg-orange-100 text-orange-700", icon: "⚡" },
      urgent: { color: "bg-red-100 text-red-700", icon: "🚨" },
    };
    return badges[priority as keyof typeof badges] || badges.normal;
  };

  return (
    <Sheet open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <SheetTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
          <Sparkles className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-full sm:w-[700px] overflow-y-auto bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-l-0 shadow-2xl"
      >
        <SheetHeader>
          <SheetTitle className={cn(
            "flex items-center gap-3 text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
            stepConfig[currentStep].gradient
          )}>
            <div className={cn(
              "p-2 rounded-xl bg-gradient-to-r text-white",
              stepConfig[currentStep].gradient
            )}>
              {stepConfig[currentStep].icon}
            </div>
            Agendar Momento de Cuidado
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Enhanced Step Indicator */}
          <div className="flex items-center justify-between relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <div 
              className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ 
                width: `${(Object.keys(stepConfig).indexOf(currentStep) / (Object.keys(stepConfig).length - 1)) * 100}%` 
              }}
            />
            
            {Object.entries(stepConfig).map(([step, config], index) => {
              const isActive = step === currentStep;
              const isCompleted = Object.keys(stepConfig).indexOf(currentStep) > index;
              
              return (
                <div key={step} className="flex flex-col items-center relative">
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 z-10",
                      isActive 
                        ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg scale-110`
                        : isCompleted
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                    )}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : config.icon}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={cn(
                      "text-xs font-medium",
                      isActive ? "text-violet-600" : "text-gray-500"
                    )}>
                      {config.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className={cn(
              "bg-gradient-to-r text-white rounded-t-lg",
              stepConfig[currentStep].gradient
            )}>
              <CardTitle className="flex items-center gap-2">
                {stepConfig[currentStep].icon}
                {stepConfig[currentStep].title}
              </CardTitle>
              <CardDescription className="text-white/90">
                {stepConfig[currentStep].description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Step 1: Client & Pet Selection */}
              {currentStep === "client" && (
                <div className="space-y-6">
                  {/* Customer Selection */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <User className="h-4 w-4" />
                      Escolha o Cliente
                    </Label>
                    <Select 
                      value={formData.customer_id} 
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, customer_id: value, pet_id: "" }));
                      }}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o responsável pela família" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id} className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm">
                                  {customer.name?.charAt(0)?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-muted-foreground">{customer.phone}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pet Selection */}
                  {formData.customer_id && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <PawPrint className="h-4 w-4" />
                        Escolha o Pet ({customerPets.length} {customerPets.length === 1 ? 'amiguinho' : 'amiguinhos'})
                      </Label>
                      
                      {customerPets.length === 0 ? (
                        <Card className="p-4 bg-yellow-50 border-yellow-200">
                          <p className="text-yellow-800 text-center">
                            Este cliente ainda não tem pets cadastrados.
                          </p>
                        </Card>
                      ) : (
                        <div className="grid gap-3">
                          {customerPets.map((pet: any) => (
                            <Card 
                              key={pet.id}
                              className={cn(
                                "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                                formData.pet_id === pet.id 
                                  ? "ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-900/20" 
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              )}
                              onClick={() => setFormData(prev => ({ ...prev, pet_id: pet.id }))}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white font-semibold">
                                  {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}
                                </div>
                                <div>
                                  <div className="font-semibold">{pet.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {pet.species === 'dog' ? 'Cãozinho' : pet.species === 'cat' ? 'Gatinho' : 'Pet'} 
                                    {pet.breed && ` • ${pet.breed}`}
                                  </div>
                                </div>
                                {formData.pet_id === pet.id && (
                                  <CheckCircle className="h-5 w-5 text-violet-500 ml-auto" />
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Summary */}
                  {selectedCustomer && selectedPet && (
                    <Card className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <Avatar className="border-2 border-white">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white">
                              {selectedCustomer.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white border-2 border-white">
                            🐾
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-violet-900">
                            {selectedCustomer.name} & {selectedPet.name}
                          </div>
                          <div className="text-sm text-violet-700">
                            Prontos para receber nosso carinho! ✨
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === "service" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Que tipo de cuidado especial?</h3>
                    <p className="text-muted-foreground">Escolha o serviço perfeito para {selectedPet?.name}</p>
                  </div>

                  <div className="grid gap-4">
                    {services.map((service) => (
                      <Card 
                        key={service.value}
                        className={cn(
                          "p-4 cursor-pointer transition-all duration-200 hover:shadow-lg",
                          formData.service_type === service.value
                            ? "ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-lg" 
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                        onClick={() => setFormData(prev => ({ ...prev, service_type: service.value }))}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{service.emoji}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{service.label}</h4>
                              <Badge variant="outline" className="text-xs">
                                {service.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1 text-sm">
                                <Timer className="h-3 w-3" />
                                {service.duration}min
                              </div>
                              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                                <DollarSign className="h-3 w-3" />
                                R$ {service.price}
                              </div>
                            </div>
                          </div>
                          {formData.service_type === service.value && (
                            <CheckCircle className="h-5 w-5 text-pink-500" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {selectedService && (
                    <Card className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{selectedService.emoji}</div>
                        <div>
                          <div className="font-semibold text-pink-900">{selectedService.label}</div>
                          <div className="text-sm text-pink-700">
                            {selectedService.duration} minutos • R$ {selectedService.price}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 3: Schedule */}
              {currentStep === "schedule" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Quando será este momento especial?</h3>
                    <p className="text-muted-foreground">
                      {selectedService?.label} para {selectedPet?.name}
                    </p>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <CalendarIcon className="h-4 w-4" />
                      Escolha a Data
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal",
                            !formData.appointment_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.appointment_date ? (
                            format(formData.appointment_date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            "Selecione uma data"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.appointment_date}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, appointment_date: date }))}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Selection */}
                  {formData.appointment_date && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <Clock className="h-4 w-4" />
                        Escolha o Horário
                      </Label>
                      
                      <div className="space-y-4">
                        {["Manhã", "Tarde"].map((period) => (
                          <div key={period}>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">{period}</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {timeSlots
                                .filter(slot => slot.period === period)
                                .map((slot) => (
                                <Button
                                  key={slot.time}
                                  variant={formData.appointment_time === slot.time ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setFormData(prev => ({ ...prev, appointment_time: slot.time }))}
                                  className={cn(
                                    "h-10",
                                    formData.appointment_time === slot.time && 
                                    "bg-gradient-to-r from-purple-500 to-violet-500 text-white"
                                  )}
                                >
                                  {slot.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule Summary */}
                  {formData.appointment_date && formData.appointment_time && (
                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                      <div className="text-center">
                        <div className="text-2xl mb-2">📅</div>
                        <div className="font-semibold text-purple-900">
                          {format(formData.appointment_date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </div>
                        <div className="text-lg font-bold text-purple-700">
                          às {formData.appointment_time}
                        </div>
                        <div className="text-sm text-purple-600 mt-2">
                          Duração estimada: {selectedService?.duration} minutos
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 4: Details */}
              {currentStep === "details" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Vamos personalizar o atendimento</h3>
                    <p className="text-muted-foreground">Detalhes extras para tornar tudo perfeito</p>
                  </div>

                  {/* Priority */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Zap className="h-4 w-4" />
                      Prioridade do Atendimento
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "low", label: "Normal", desc: "Sem pressa" },
                        { value: "normal", label: "Padrão", desc: "Atendimento regular" },
                        { value: "high", label: "Alta", desc: "Priorizar" },
                        { value: "urgent", label: "Urgente", desc: "Emergência" },
                      ].map((priority) => {
                        const badge = getPriorityBadge(priority.value);
                        return (
                          <Button
                            key={priority.value}
                            variant={formData.priority === priority.value ? "default" : "outline"}
                            onClick={() => setFormData(prev => ({ ...prev, priority: priority.value as any }))}
                            className={cn(
                              "h-16 flex-col gap-1",
                              formData.priority === priority.value && badge.color
                            )}
                          >
                            <div>{badge.icon}</div>
                            <div className="text-xs">{priority.label}</div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Switches */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Lembrete automático</div>
                          <div className="text-sm text-muted-foreground">Enviar WhatsApp antes do horário</div>
                        </div>
                      </div>
                      <Switch
                        checked={formData.reminder_enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder_enabled: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-pink-500" />
                        <div>
                          <div className="font-medium">Acompanhamento</div>
                          <div className="text-sm text-muted-foreground">Follow-up pós-atendimento</div>
                        </div>
                      </div>
                      <Switch
                        checked={formData.follow_up_needed}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, follow_up_needed: checked }))}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <MessageSquare className="h-4 w-4" />
                      Observações Especiais
                    </Label>
                    <Textarea
                      placeholder="Ex: Pet nervoso, precisa de cuidado especial com orelhas..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Preparation Notes */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Star className="h-4 w-4" />
                      Preparação Necessária
                    </Label>
                    <Textarea
                      placeholder="Ex: Trazer em jejum, últimas vacinas, medicamentos..."
                      value={formData.preparation_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, preparation_notes: e.target.value }))}
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === "review" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <h3 className="text-lg font-semibold mb-2">Tudo pronto para o agendamento!</h3>
                    <p className="text-muted-foreground">Revise os detalhes antes de confirmar</p>
                  </div>

                  {/* Appointment Summary */}
                  <Card className="border-2 border-gradient-to-r from-violet-200 to-purple-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg">{selectedService?.label}</h4>
                          <p className="opacity-90">{selectedService?.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">R$ {formData.price}</div>
                          <div className="text-sm opacity-90">{formData.duration} min</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          <Avatar className="border-2 border-white">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white">
                              {selectedCustomer?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white border-2 border-white text-lg">
                            🐾
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">{selectedCustomer?.name}</div>
                          <div className="text-muted-foreground">com {selectedPet?.name}</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-purple-500" />
                          <div>
                            <div className="font-medium">Data</div>
                            <div className="text-sm text-muted-foreground">
                              {format(formData.appointment_date, "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <div>
                            <div className="font-medium">Horário</div>
                            <div className="text-sm text-muted-foreground">{formData.appointment_time}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                          {getPriorityBadge(formData.priority).icon}
                        </div>
                        <div>
                          <div className="font-medium">Prioridade</div>
                          <div className="text-sm text-muted-foreground capitalize">{formData.priority}</div>
                        </div>
                      </div>

                      {(formData.reminder_enabled || formData.follow_up_needed) && (
                        <>
                          <Separator />
                          <div className="flex gap-4">
                            {formData.reminder_enabled && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                <Bell className="h-3 w-3 mr-1" />
                                Lembrete automático
                              </Badge>
                            )}
                            {formData.follow_up_needed && (
                              <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">
                                <Heart className="h-3 w-3 mr-1" />
                                Follow-up
                              </Badge>
                            )}
                          </div>
                        </>
                      )}

                      {(formData.notes || formData.preparation_notes) && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            {formData.notes && (
                              <div>
                                <div className="font-medium text-sm">Observações:</div>
                                <div className="text-sm text-muted-foreground">{formData.notes}</div>
                              </div>
                            )}
                            {formData.preparation_notes && (
                              <div>
                                <div className="font-medium text-sm">Preparação:</div>
                                <div className="text-sm text-muted-foreground">{formData.preparation_notes}</div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === "client"}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

            {currentStep === "review" ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};