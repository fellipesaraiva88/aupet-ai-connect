import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
import { Calendar } from "@/components/ui/calendar";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useOrganizationId,
  useCustomers,
  usePets,
} from "@/hooks/useSupabaseData";
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
} from "lucide-react";

type AppointmentFormData = {
  client_id: string;
  pet_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  price: number;
  notes?: string;
};

const services = [
  "Banho e Tosa",
  "Banho",
  "Tosa",
  "Consulta Veterinária",
  "Vacinação",
  "Castração",
  "Check-up",
  "Emergência",
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

const Appointments = () => {
  const [activeMenuItem] = useState("appointments");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    client_id: "",
    pet_id: "",
    service_type: "",
    appointment_date: "",
    appointment_time: "",
    price: 0,
    notes: "",
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

  const filteredAppointments = appointments.filter((appointment) => {
    const customerName = appointment.whatsapp_contacts?.name || '';
    const petName = appointment.pets?.name || '';
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

  const stats = {
    total: appointments.length,
    today: appointments.filter(a => {
      const appointmentDate = new Date(a.appointment_date).toISOString().split('T')[0];
      return appointmentDate === today;
    }).length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    pending: appointments.filter(a => a.status === "pending").length,
  };

  const customerPets = pets.filter(pet => pet.owner_id === selectedCustomer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}:00`);

      if (editingAppointment) {
        await updateAppointmentMutation.mutateAsync({
          id: editingAppointment.id,
          updates: {
            client_id: formData.client_id,
            pet_id: formData.pet_id,
            service_type: formData.service_type,
            appointment_date: appointmentDateTime.toISOString(),
            price: formData.price,
            notes: formData.notes,
          },
        });
        toast({
          title: "Agendamento atualizado",
          description: "O agendamento foi atualizado com sucesso.",
        });
      } else {
        await createAppointmentMutation.mutateAsync({
          client_id: formData.client_id,
          pet_id: formData.pet_id,
          service_type: formData.service_type,
          appointment_date: appointmentDateTime.toISOString(),
          price: formData.price,
          notes: formData.notes,
          organization_id: organizationId,
          status: 'pending',
        });
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso.",
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
      });
      setSelectedCustomer("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o agendamento. Tente novamente.",
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
          onItemClick={() => {}}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-primary font-bold tracking-tight text-primary flex items-center gap-3">
                  <CalendarIcon className="h-8 w-8" />
                  Agendamentos
                </h1>
                <p className="text-muted-foreground font-secondary">
                  Organize sua agenda de forma eficiente
                </p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingAppointment ? "Atualize os dados do agendamento" : "Agende um novo serviço para o cliente"}
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
                        <Select value={formData.service_type} onValueChange={(value) => setFormData({ ...formData, service_type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
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
                        <div className="space-y-2">
                          <Label htmlFor="price">Preço (R$)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Input
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Informações adicionais sobre o agendamento"
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
                        {editingAppointment ? "Atualizar" : "Agendar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <CalendarIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.total}</p>
                      )}
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
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.today}</p>
                      )}
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
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.confirmed}</p>
                      )}
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
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mb-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.pending}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por cliente, pet ou serviço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="confirmed">Confirmados</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="completed">Concluídos</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterDate} onValueChange={setFilterDate}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Próximos 7 dias</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Mais Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appointments List */}
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
                    <Card key={index} className="border-l-4">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-32" />
                              <Skeleton className="h-3 w-64" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-8 w-32" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Erro ao carregar agendamentos</p>
                </div>
              ) : (
                filteredAppointments.map((appointment) => (
                  <Card key={appointment.id} className={`border-l-4 ${getStatusColor(appointment.status)}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-white">
                              {appointment.whatsapp_contacts?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{appointment.whatsapp_contacts?.name || 'Cliente não informado'}</h3>
                              <span className="text-muted-foreground">•</span>
                              <span className="font-medium text-primary">{appointment.pets?.name || 'Pet não informado'}</span>
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
                              <div className="flex items-center font-secondary font-bold text-primary">
                                R$ {(appointment.price || 0).toFixed(2)}
                              </div>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(appointment.status)}

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

            {!isLoading && !error && filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum agendamento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== "all" || filterDate !== "all"
                    ? "Tente ajustar os filtros para encontrar agendamentos."
                    : "Comece criando seu primeiro agendamento."}
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Agendamento
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Appointments;