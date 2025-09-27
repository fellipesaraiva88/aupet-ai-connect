import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Calendar } from "@/components/ui/calendar";
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
} from "lucide-react";

const appointments = [
  {
    id: "1",
    customerName: "Maria Silva",
    petName: "Luna",
    service: "Banho e Tosa",
    date: "2024-09-28",
    time: "14:00",
    duration: 60,
    status: "confirmed" as const,
    price: 80.00,
    notes: "Golden Retriever, primeira vez na loja",
    customerPhone: "+55 11 99999-1234",
  },
  {
    id: "2",
    customerName: "João Santos",
    petName: "Buddy",
    service: "Consulta Veterinária",
    date: "2024-09-28",
    time: "10:30",
    duration: 45,
    status: "confirmed" as const,
    price: 120.00,
    notes: "Check-up de rotina",
    customerPhone: "+55 11 99999-5678",
  },
  {
    id: "3",
    customerName: "Ana Costa",
    petName: "Mimi",
    service: "Vacinação",
    date: "2024-09-29",
    time: "16:00",
    duration: 30,
    status: "pending" as const,
    price: 60.00,
    notes: "Vacina antirrábica",
    customerPhone: "+55 11 99999-9012",
  },
  {
    id: "4",
    customerName: "Carlos Lima",
    petName: "Rex",
    service: "Banho e Tosa",
    date: "2024-09-30",
    time: "09:00",
    duration: 90,
    status: "cancelled" as const,
    price: 100.00,
    notes: "Pastor Alemão grande porte",
    customerPhone: "+55 11 99999-3456",
  },
  {
    id: "5",
    customerName: "Fernanda Rocha",
    petName: "Nala",
    service: "Banho",
    date: "2024-09-27",
    time: "15:30",
    duration: 45,
    status: "completed" as const,
    price: 50.00,
    notes: "Gato Siamês, muito dócil",
    customerPhone: "+55 11 99999-7890",
  },
];

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

  const today = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;

    let matchesDate = true;
    if (filterDate === "today") {
      matchesDate = appointment.date === today;
    } else if (filterDate === "week") {
      const appointmentDate = new Date(appointment.date);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      matchesDate = appointmentDate >= new Date() && appointmentDate <= weekFromNow;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: appointments.length,
    today: appointments.filter(a => a.date === today).length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    pending: appointments.filter(a => a.status === "pending").length,
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

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                    <DialogDescription>
                      Agende um novo serviço para o cliente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cliente</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maria">Maria Silva</SelectItem>
                            <SelectItem value="joao">João Santos</SelectItem>
                            <SelectItem value="ana">Ana Costa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pet</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar pet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="luna">Luna (Golden Retriever)</SelectItem>
                            <SelectItem value="buddy">Buddy (Labrador)</SelectItem>
                            <SelectItem value="mimi">Mimi (Gato Siamês)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Serviço</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service} value={service.toLowerCase()}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data</label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Horário</label>
                        <Select>
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
                        <label className="text-sm font-medium">Preço (R$)</label>
                        <Input type="number" placeholder="0,00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observações</label>
                      <Input placeholder="Informações adicionais sobre o agendamento" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline">Cancelar</Button>
                    <Button variant="default">Agendar</Button>
                  </div>
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
                <span className="text-sm text-muted-foreground">
                  {filteredAppointments.length} agendamento(s)
                </span>
              </div>

              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className={`border-l-4 ${getStatusColor(appointment.status)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-white">
                            {appointment.customerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{appointment.customerName}</h3>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-medium text-primary">{appointment.petName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{appointment.service}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {new Date(appointment.date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {appointment.time} ({appointment.duration}min)
                            </div>
                            <div className="flex items-center font-secondary font-bold text-primary">
                              R$ {appointment.price.toFixed(2)}
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

                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum agendamento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== "all" || filterDate !== "all"
                    ? "Tente ajustar os filtros para encontrar agendamentos."
                    : "Comece criando seu primeiro agendamento."}
                </p>
                <Button variant="outline">
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