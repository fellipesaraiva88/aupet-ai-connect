import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Users,
  Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  city: string;
  state: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: {
    contact_name?: string;
    website?: string;
  };
}

interface WhatsAppInstance {
  id: string;
  organization_id: string;
  name: string;
  phone_number: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qr_code: string;
  last_connection: string;
  evolution_instance_id: string;
}

export default function Organizations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrgInstances, setSelectedOrgInstances] = useState<WhatsAppInstance[]>([]);

  // Fetch organizations
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
  });

  // Fetch WhatsApp instances count by organization
  const { data: whatsappStats } = useQuery({
    queryKey: ['admin-whatsapp-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('organization_id, status');

      if (error) throw error;

      // Group by organization_id and count statuses
      const stats = data.reduce((acc, instance) => {
        if (!acc[instance.organization_id]) {
          acc[instance.organization_id] = {
            total: 0,
            connected: 0,
            disconnected: 0,
            connecting: 0,
          };
        }
        acc[instance.organization_id].total += 1;
        if (instance.status === 'connected') {
          acc[instance.organization_id].connected += 1;
        } else if (instance.status === 'disconnected') {
          acc[instance.organization_id].disconnected += 1;
        } else {
          acc[instance.organization_id].connecting += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; connected: number; disconnected: number; connecting: number }>);

      return stats;
    },
  });

  // Fetch users count by organization
  const { data: usersStats } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id, is_active');

      if (error) throw error;

      // Group by organization_id and count
      const stats = data.reduce((acc, profile) => {
        if (!acc[profile.organization_id]) {
          acc[profile.organization_id] = { total: 0, active: 0 };
        }
        acc[profile.organization_id].total += 1;
        if (profile.is_active) {
          acc[profile.organization_id].active += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; active: number }>);

      return stats;
    },
  });

  const viewOrgDetails = async (org: Organization) => {
    setSelectedOrg(org);
    
    // Fetch WhatsApp instances for this organization
    const { data } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false });

    setSelectedOrgInstances(data as WhatsAppInstance[] || []);
    setShowDetails(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  const getWhatsAppStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Conectando
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge variant="outline" className={colors[plan as keyof typeof colors] || colors.free}>
        {plan.toUpperCase()}
      </Badge>
    );
  };

  const filteredOrgs = organizations?.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando organizações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            Organizações
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os petshops cadastrados na plataforma
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Organização
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Organizações</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {organizations?.filter(o => o.is_active).length || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Conectados</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(whatsappStats || {}).reduce((sum, stat) => sum + stat.connected, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              de {Object.values(whatsappStats || {}).reduce((sum, stat) => sum + stat.total, 0)} instâncias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(usersStats || {}).reduce((sum, stat) => sum + stat.active, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              usuários no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Médio</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pro</div>
            <p className="text-xs text-muted-foreground">plano mais comum</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Organizações</CardTitle>
          <CardDescription>Filtre por nome, email ou cidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar organização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Organizações</CardTitle>
          <CardDescription>
            {filteredOrgs?.length || 0} organizações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs?.map((org) => {
                const whatsappStat = whatsappStats?.[org.id] || { total: 0, connected: 0, disconnected: 0, connecting: 0 };
                const usersStat = usersStats?.[org.id] || { total: 0, active: 0 };

                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {org.document || 'Sem CNPJ'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{org.email}</span>
                        </div>
                        {org.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{org.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{org.city}</p>
                        <p className="text-xs text-muted-foreground">{org.state}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {whatsappStat.total} instâncias
                          </Badge>
                        </div>
                        <div className="flex gap-1 text-xs">
                          <span className="text-green-600 font-medium">
                            {whatsappStat.connected} on
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600">
                            {whatsappStat.disconnected} off
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{usersStat.total}</p>
                        <p className="text-xs text-muted-foreground">
                          {usersStat.active} ativos
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPlanBadge(org.plan || 'free')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(org.is_active)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewOrgDetails(org)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Organization Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Organização</DialogTitle>
            <DialogDescription>
              Informações completas e instâncias WhatsApp
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-6">
              {/* Organization Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <p className="text-sm text-muted-foreground">{selectedOrg.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">CNPJ/CPF</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrg.document || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedOrg.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrg.phone || 'Não informado'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Endereço</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrg.address || 'Não informado'} - {selectedOrg.city}/{selectedOrg.state}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Plano</label>
                  <div className="mt-1">
                    {getPlanBadge(selectedOrg.plan || 'free')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrg.is_active)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Criado em</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedOrg.created_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Atualizado em</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedOrg.updated_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {/* WhatsApp Instances */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Instâncias WhatsApp</h3>
                {selectedOrgInstances.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrgInstances.map((instance) => (
                      <Card key={instance.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">{instance.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {instance.phone_number || 'Sem número'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getWhatsAppStatusBadge(instance.status)}
                              {instance.last_connection && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">
                                    Última conexão
                                  </p>
                                  <p className="text-xs font-medium">
                                    {format(
                                      new Date(instance.last_connection),
                                      'dd/MM HH:mm',
                                      { locale: ptBR }
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhuma instância WhatsApp cadastrada</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
