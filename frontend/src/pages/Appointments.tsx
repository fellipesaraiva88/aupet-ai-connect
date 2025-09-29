import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCardSkeleton, StatCardSkeleton } from "@/components/ui/optimized-skeleton";
import { ResponsiveLayouts, ResponsiveContainer } from "@/components/ui/responsive-grid";
import { EmptyStates, AppointmentFeedback } from "@/components/ui/feedback";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useOrganizationId,
  useCustomers,
  usePets,
} from "@/hooks/useApiData";
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  Phone,
  MessageSquare,
  MoreHorizontal,
  Loader2,
  List,
  Grid3x3,
  Eye,
  MapPin,
  DollarSign,
  Timer,
  Users,
  Activity,
  TrendingUp,
  Star,
} from "lucide-react";

type AppointmentFormData = {
  client_id: string;
  pet_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  price: number;
  notes?: string;
  duration?: number;
  priority?: string;
  location?: string;
  reminder_sent?: boolean;
  preparation_notes?: string;
};

const services = [
  { value: "banho-tosa", label: "🛁 Banho e Tosa", duration: 120, price: 80 },
  { value: "banho", label: "🛁 Banho", duration: 60, price: 40 },
  { value: "tosa", label: "✂️ Tosa", duration: 90, price: 50 },
  { value: "consulta", label: "🩺 Consulta Veterinária", duration: 30, price: 120 },
  { value: "vacinacao", label: "💉 Vacinação", duration: 20, price: 60 },
  { value: "castracao", label: "⚕️ Castração", duration: 180, price: 300 },
  { value: "checkup", label: "📋 Check-up Geral", duration: 45, price: 100 },
  { value: "emergencia", label: "🚨 Emergência", duration: 60, price: 200 },
  { value: "cirurgia", label: "🏥 Cirurgia", duration: 240, price: 500 },
  { value: "exame", label: "🔬 Exames Laboratoriais", duration: 15, price: 80 },
  { value: "fisioterapia", label: "🤸 Fisioterapia", duration: 60, price: 90 },
  { value: "odontologia", label: "🦷 Odontologia", duration: 90, price: 150 },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

const Appointments = () => {
  const activeMenuItem = useActiveNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    client_id: "",
    pet_id: "",
    service_type: "",
    appointment_date: "",
    appointment_time: "",
    price: 0,
    notes: "",
    duration: 60,
    priority: "normal",
    location: "Clínica Principal",
    reminder_sent: false,
    preparation_notes: "",
  });
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const organizationId = useOrganizationId();
  const { data: appointments = [], isLoading, error } = useAppointments(organizationId);
  const { data: customers = [] } = useCustomers(organizationId);
  const { data: pets = [] } = usePets(organizationId);
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  // Memoize filtered appointments for performance
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const customerName = (appointment as any).whatsapp_contacts?.name || '';
      const petName = (appointment as any).pets?.name || '';
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;

      let matchesDate = true;
      if (filterDate === "today") {
        const appointmentDate = new Date(appointment.appointment_date).toISOString().split('T')[0];
        matchesDate = appointmentDate === today;
      } else if (filterDate === "week") {
        const appointmentDate = new Date(appointment.appointment_date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        matchesDate = appointmentDate >= new Date() && appointmentDate <= weekFromNow;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchTerm, filterStatus, filterDate, today]);

  // Memoize stats for performance
  const stats = useMemo(() => {
    const todayAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.appointment_date).toISOString().split('T')[0];
      return appointmentDate === today;
    });

    const thisWeekRevenue = appointments.filter(a => {
      const appointmentDate = new Date(a.appointment_date);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return appointmentDate >= weekStart && appointmentDate <= weekEnd && a.status === 'completed';
    }).reduce((sum, a) => sum + (a.price || 0), 0);

    return {
      total: appointments.length,
      today: todayAppointments.length,
      confirmed: appointments.filter(a => a.status === "confirmed").length,
      pending: appointments.filter(a => a.status === "pending").length,
      completed: appointments.filter(a => a.status === "completed").length,
      revenue: thisWeekRevenue,
      averageDaily: todayAppointments.length > 0 ? todayAppointments.length / 7 : 0,
    };
  }, [appointments, today]);

  const customerPets = pets.filter(pet => (pet as any).customer_id === selectedCustomer);

  // Auto-fill price and duration when service is selected
  const handleServiceChange = (serviceValue: string) => {
    const service = services.find(s => s.value === serviceValue);
    if (service) {
      setFormData(prev => ({
        ...prev,
        service_type: serviceValue,
        price: service.price,
        duration: service.duration,
      }));
    } else {
      setFormData(prev => ({ ...prev, service_type: serviceValue }));
    }
  };

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDetailDialogOpen(true);
  };

  // Get appointments for selected date in calendar view
  const appointmentsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date).toISOString().split('T')[0];
      return appointmentDate === dateStr;
    });
  }, [appointments, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}:00`);

      if (editingAppointment) {
        await updateAppointmentMutation.mutateAsync({
          id: editingAppointment.id,
          updates: {
            customer_id: formData.client_id,
            pet_id: formData.pet_id,
            service_type: formData.service_type,
            appointment_date: appointmentDateTime.toISOString(),
            price: formData.price,
            ...(formData.notes && { post_appointment_notes: formData.notes }),
          } as any,
        });
        toast({
          title: "Momento de cuidado ajustado! ⏰",
          description: "Perfeito! Agora tudo está organizado para oferecer o melhor cuidado neste momento especial.",
        });
      } else {
        await createAppointmentMutation.mutateAsync({
          customer_id: formData.client_id,
          pet_id: formData.pet_id,
          service_type: formData.service_type,
          appointment_date: appointmentDateTime.toISOString(),
          price: formData.price,
          ...(formData.notes && { post_appointment_notes: formData.notes }),
          organization_id: organizationId,
          status: 'scheduled',
        } as any);
        toast({
          title: "Momento especial agendado! 💖",
          description: "Que maravilha! Este amiguinho terá um momento especial de cuidado reservado só para ele.",
        });
      }
      setIsDialogOpen(false);
      setEditingAppointment(null);
      setFormData({
        client_id: "",
        pet_id: "",
        service_type: "",
        appointment_date: "",
        appointment_time: "",
        price: 0,
        notes: "",
        duration: 60,
        priority: "normal",
        location: "Clínica Principal",
        reminder_sent: false,
        preparation_notes: "",
      });
      setSelectedCustomer("");
    } catch (error) {
      toast({
        title: "Ops, um pequeno contratempo",
        description: "Não conseguimos agendar agora, mas não desista! Vamos tentar novamente juntos.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (appointment: any) => {
    setEditingAppointment(appointment);
    const appointmentDate = new Date(appointment.appointment_date);
    setFormData({
      client_id: appointment.client_id || "",
      pet_id: appointment.pet_id || "",
      service_type: appointment.service_type || "",
      appointment_date: appointmentDate.toISOString().split('T')[0],
      appointment_time: appointmentDate.toTimeString().slice(0, 5),
      price: appointment.price || 0,
      notes: appointment.notes || "",
    });
    setSelectedCustomer(appointment.client_id || "");
    setIsDialogOpen(true);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingAppointment(null);
    setFormData({
      client_id: "",
      pet_id: "",
      service_type: "",
      appointment_date: "",
      appointment_time: "",
      price: 0,
      notes: "",
      duration: 60,
      priority: "normal",
      location: "Clínica Principal",
      reminder_sent: false,
      preparation_notes: "",
    });
    setSelectedCustomer("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="secondary" className="text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-warning">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-primary text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "border-l-success";
      case "pending": return "border-l-warning";
      case "completed": return "border-l-primary";
      case "cancelled": return "border-l-destructive";
      default: return "border-l-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeItem={activeMenuItem}
        />

        <main className="flex-1 overflow-auto">
          <ResponsiveContainer className="py-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-primary font-bold tracking-tight text-primary flex items-center gap-3">
                  <CalendarIcon className="h-8 w-8" />
                  Momentos de Cuidado Agendados
                </h1>
                <p className="text-muted-foreground font-secondary">
                  Cada agendamento é uma promessa de cuidado. Vamos garantir que todos os amiguinhos tenham sua atenção especial.
                </p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Agendar Momento de Cuidado
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAppointment ? "Ajustar Momento de Cuidado" : "Criar Momento Especial"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingAppointment ? "Vamos ajustar todos os detalhes para garantir o melhor cuidado" : "Vamos planejar um momento especial de cuidado para este amiguinho"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customer">Cliente</Label>
                          <Select value={selectedCustomer} onValueChange={(value) => {
                            setSelectedCustomer(value);
                            setFormData({ ...formData, client_id: value, pet_id: "" });
                          }}>
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
                        <div className="space-y-2">
                          <Label htmlFor="pet">Pet</Label>
                          <Select value={formData.pet_id} onValueChange={(value) => setFormData({ ...formData, pet_id: value })} disabled={!selectedCustomer}>
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service">Serviço</Label>
                        <Select value={formData.service_type} onValueChange={handleServiceChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.value} value={service.value}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{service.label}</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4">
                                    <span>{service.duration}min</span>
                                    <span>R$ {service.price}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Data</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.appointment_date}
                            onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Horário</Label>
                          <Select value={formData.appointment_time} onValueChange={(value) => setFormData({ ...formData, appointment_time: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Horário" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration" className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            Duração (min)
                          </Label>
                          <Input
                            id="duration"
                            type="number"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                            placeholder="60"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Preço (R$)
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Prioridade</Label>
                          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Normal" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">🟢 Baixa</SelectItem>
                              <SelectItem value="normal">🟡 Normal</SelectItem>
                              <SelectItem value="high">🟠 Alta</SelectItem>
                              <SelectItem value="urgent">🔴 Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Local
                        </Label>
                        <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar local" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Clínica Principal">🏥 Clínica Principal</SelectItem>
                            <SelectItem value="Sala de Cirurgia">⚕️ Sala de Cirurgia</SelectItem>
                            <SelectItem value="Área de Banho e Tosa">🛁 Área de Banho e Tosa</SelectItem>
                            <SelectItem value="Atendimento Domiciliar">🏠 Atendimento Domiciliar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Informações adicionais sobre o agendamento"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preparation_notes">Notas de Preparação</Label>
                        <Textarea
                          id="preparation_notes"
                          value={formData.preparation_notes}
                          onChange={(e) => setFormData({ ...formData, preparation_notes: e.target.value })}
                          placeholder="Instruções especiais para preparação do atendimento"
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
                      >
                        {(createAppointmentMutation.isPending || updateAppointmentMutation.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {editingAppointment ? "Salvar com Carinho" : "Confirmar Cuidado"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <ResponsiveLayouts.Stats>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <CalendarIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.total}</p>
                          <p className="text-sm text-muted-foreground">Total Agendamentos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-secondary/10 p-3">
                          <Clock className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.today}</p>
                          <p className="text-sm text-muted-foreground">Hoje</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-success/10 p-3">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.confirmed}</p>
                          <p className="text-sm text-muted-foreground">Confirmados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-warning/10 p-3">
                          <AlertCircle className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.pending}</p>
                          <p className="text-sm text-muted-foreground">Pendentes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-green-100 p-3">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">R$ {stats.revenue.toFixed(0)}</p>
                          <p className="text-sm text-muted-foreground">Receita da Semana</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-blue-100 p-3">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.completed}</p>
                          <p className="text-sm text-muted-foreground">Concluídos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </ResponsiveLayouts.Stats>

            {/* Filters and View Toggle */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por cliente, pet ou serviço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="confirmed">✅ Confirmados</SelectItem>
                        <SelectItem value="pending">⏳ Pendentes</SelectItem>
                        <SelectItem value="completed">🏆 Concluídos</SelectItem>
                        <SelectItem value="cancelled">❌ Cancelados</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterDate} onValueChange={setFilterDate}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="today">📅 Hoje</SelectItem>
                        <SelectItem value="week">📆 Próximos 7 dias</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 border rounded-lg p-1">
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "calendar" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("calendar")}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Mais Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Content */}
            {viewMode === "calendar" ? (
              // Calendar View
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Selecionar Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border w-full"
                    />
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                        <span className="text-sm">Confirmados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-warning rounded-full"></div>
                        <span className="text-sm">Pendentes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-sm">Concluídos</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>
                      Agendamentos para {selectedDate?.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                    <CardDescription>
                      {appointmentsForDate.length} agendamento(s) para este dia
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {appointmentsForDate.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhum agendamento para esta data</p>
                        <Button onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            appointment_date: selectedDate?.toISOString().split('T')[0] || ''
                          }));
                          setIsDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Agendar para esta data
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {appointmentsForDate
                          .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
                          .map((appointment) => (
                            <Card key={appointment.id} className={`border-l-4 ${getStatusColor(appointment.status)}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="text-center">
                                      <div className="text-sm font-bold">
                                        {new Date(appointment.appointment_date).toLocaleTimeString('pt-BR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                         {(appointment as any).duration || 60}min
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-sm">
                                           {(appointment as any).whatsapp_contacts?.name || 'Cliente não informado'}
                                        </h4>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-sm text-primary">
                                           {(appointment as any).pets?.name || 'Pet não informado'}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">{appointment.service_type}</p>
                                      <p className="text-sm font-bold text-primary">R$ {(appointment.price || 0).toFixed(2)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(appointment.status)}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewDetails(appointment)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              // List View
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Agendamentos {filterDate === "today" && "de Hoje"}
                  </h2>
                  {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {filteredAppointments.length} agendamento(s)
                    </span>
                  )}
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <AppointmentCardSkeleton key={index} />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Erro ao carregar agendamentos</p>
                  </div>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <Card key={appointment.id} className={`border-l-4 ${getStatusColor(appointment.status)} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary text-white">
                                {(appointment as any).whatsapp_contacts?.name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{(appointment as any).whatsapp_contacts?.name || 'Cliente não informado'}</h3>
                                <span className="text-muted-foreground">•</span>
                                <span className="font-medium text-primary">{(appointment as any).pets?.name || 'Pet não informado'}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{appointment.service_type}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {new Date(appointment.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center">
                                  <Timer className="h-4 w-4 mr-1" />
                                  {(appointment as any).duration || 60}min
                                </div>
                                <div className="flex items-center font-secondary font-bold text-primary">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {(appointment.price || 0).toFixed(2)}
                                </div>
                              </div>
                              {(appointment as any).notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                  {(appointment as any).notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {getStatusBadge(appointment.status)}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(appointment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Conversar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Ligar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {!isLoading && !error && filteredAppointments.length === 0 && viewMode === "list" && (
              searchTerm || filterStatus !== "all" || filterDate !== "all" ? (
                <EmptyStates.SearchNoResults />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum agendamento encontrado</p>
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    Agendar Consulta
                  </Button>
                </div>
              )
            )}

            {/* Dialog de Detalhes do Agendamento */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Detalhes do Agendamento
                  </DialogTitle>
                  <DialogDescription>
                    Informações completas sobre este momento de cuidado
                  </DialogDescription>
                </DialogHeader>

                {selectedAppointment && (
                  <div className="space-y-6">
                    {/* Info Principal */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">CLIENTE</Label>
                            <p className="font-semibold">{selectedAppointment.whatsapp_contacts?.name || 'Não informado'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">PET</Label>
                            <p className="font-semibold">{selectedAppointment.pets?.name || 'Não informado'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">SERVIÇO</Label>
                            <p className="font-semibold">{selectedAppointment.service_type}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">STATUS</Label>
                            <div className="mt-1">
                              {getStatusBadge(selectedAppointment.status)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data e Hora */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Data e Horário</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">DATA</Label>
                            <p className="font-semibold">
                              {new Date(selectedAppointment.appointment_date).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">HORÁRIO</Label>
                            <p className="font-semibold">
                              {new Date(selectedAppointment.appointment_date).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">DURAÇÃO</Label>
                            <p className="font-semibold">{selectedAppointment.duration || 60} minutos</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Valor e Observações */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Informações Adicionais</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">VALOR</Label>
                            <p className="text-2xl font-bold text-primary">
                              R$ {(selectedAppointment.price || 0).toFixed(2)}
                            </p>
                          </div>
                          {selectedAppointment.notes && (
                            <div>
                              <Label className="text-xs text-muted-foreground">OBSERVAÇÕES</Label>
                              <p className="text-sm">{selectedAppointment.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ações */}
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                        Fechar
                      </Button>
                      <Button onClick={() => {
                        handleEdit(selectedAppointment);
                        setIsDetailDialogOpen(false);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Agendamento
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </ResponsiveContainer>
        </main>
      </div>
    </div>
  );
};

export default Appointments;