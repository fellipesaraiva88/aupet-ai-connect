import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Plus, Edit, Trash2, Lock, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export default function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Role[];
    },
  });

  const permissionCategories = {
    dashboard: {
      name: 'Dashboard',
      permissions: ['dashboard.read', 'dashboard.write', 'dashboard.*'],
    },
    whatsapp: {
      name: 'WhatsApp',
      permissions: ['whatsapp.read', 'whatsapp.write', 'whatsapp.delete', 'whatsapp.*'],
    },
    customers: {
      name: 'Clientes',
      permissions: ['customers.read', 'customers.create', 'customers.update', 'customers.delete', 'customers.*'],
    },
    pets: {
      name: 'Pets',
      permissions: ['pets.read', 'pets.create', 'pets.update', 'pets.delete', 'pets.*'],
    },
    appointments: {
      name: 'Agendamentos',
      permissions: ['appointments.read', 'appointments.create', 'appointments.update', 'appointments.delete', 'appointments.*'],
    },
    users: {
      name: 'Usuários',
      permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'users.*'],
    },
    settings: {
      name: 'Configurações',
      permissions: ['settings.read', 'settings.write', 'settings.*'],
    },
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const hasPermission = (role: Role, permission: string) => {
    if (role.permissions.includes('*')) return true;
    if (role.permissions.includes(permission)) return true;
    
    const namespace = permission.split('.')[0];
    return role.permissions.includes(`${namespace}.*`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles e Permissões</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie roles e suas permissões no sistema
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles do Sistema</CardTitle>
            <Lock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles?.filter(r => r.is_system_role).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Customizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles?.filter(r => !r.is_system_role).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(permissionCategories).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles Cadastradas</CardTitle>
          <CardDescription>Clique em uma role para ver suas permissões</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Atualizada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles?.map((role) => (
                <TableRow
                  key={role.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRole(role)}
                >
                  <TableCell>
                    <Badge variant="outline" className={getRoleColor(role.name)}>
                      {role.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate">{role.description}</div>
                  </TableCell>
                  <TableCell>
                    {role.is_system_role ? (
                      <Badge variant="destructive">Sistema</Badge>
                    ) : (
                      <Badge variant="secondary">Customizada</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{role.permissions.length}</Badge>
                      {role.permissions.includes('*') && (
                        <Badge variant="destructive" className="text-xs">TOTAL</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(role.updated_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={role.is_system_role}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={role.is_system_role}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Permissões da Role: {selectedRole.name}</CardTitle>
            <CardDescription>{selectedRole.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(permissionCategories).map(([key, category]) => (
                <div key={key}>
                  <h3 className="font-semibold mb-3">{category.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {category.permissions.map((permission) => (
                      <div
                        key={permission}
                        className={`
                          flex items-center gap-2 p-2 rounded-md border
                          ${hasPermission(selectedRole, permission)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                          }
                        `}
                      >
                        {hasPermission(selectedRole, permission) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className="text-sm">{permission.split('.')[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
