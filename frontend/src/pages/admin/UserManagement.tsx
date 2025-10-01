import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/admin/UserTable';
import { Users as UsersIcon, Download, Upload } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

// Mock data - Replace with real API calls
const mockUsers = [
  {
    id: '1',
    email: 'admin@auzap.ai',
    full_name: 'Admin Principal',
    role: { name: 'super_admin', description: 'Super Administrador' },
    organization: { name: 'Auzap' },
    is_active: true,
    last_login: '2025-01-10T10:30:00Z',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'manager@petshop.com',
    full_name: 'João Silva',
    role: { name: 'admin', description: 'Administrador' },
    organization: { name: 'Petshop VIP' },
    is_active: true,
    last_login: '2025-01-10T09:15:00Z',
    created_at: '2024-06-15T00:00:00Z'
  },
  {
    id: '3',
    email: 'maria@petshop.com',
    full_name: 'Maria Santos',
    role: { name: 'manager', description: 'Gerente' },
    organization: { name: 'Petshop VIP' },
    is_active: true,
    last_login: '2025-01-09T16:45:00Z',
    created_at: '2024-08-20T00:00:00Z'
  },
  {
    id: '4',
    email: 'inactive@example.com',
    full_name: 'Usuário Inativo',
    role: { name: 'user', description: 'Usuário' },
    organization: { name: 'Pet Care' },
    is_active: false,
    last_login: null,
    created_at: '2024-03-10T00:00:00Z'
  }
];

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (user: any) => {
    toast.info('Editar Usuário', `Editando ${user.email}`);
    // TODO: Open edit modal
  };

  const handleDelete = (user: any) => {
    const action = user.is_active ? 'desativar' : 'reativar';
    toast.warning('Confirmar Ação', `Deseja ${action} ${user.email}?`);
    // TODO: Implement delete/deactivate
  };

  const handleResetPassword = (user: any) => {
    toast.success('Email Enviado', `Link de recuperação enviado para ${user.email}`);
    // TODO: Implement password reset
  };

  const handleCreateNew = () => {
    toast.info('Novo Usuário', 'Abrindo formulário de criação');
    // TODO: Open create modal
  };

  const handleExport = () => {
    toast.success('Exportando', 'Preparando arquivo CSV...');
    // TODO: Implement export
  };

  const handleImport = () => {
    toast.info('Importar', 'Selecione um arquivo CSV');
    // TODO: Implement import
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários, roles e permissões do sistema
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Usuários</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários Ativos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {users.filter(u => u.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários Inativos</CardDescription>
            <CardTitle className="text-3xl text-gray-600">
              {users.filter(u => !u.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {users.filter(u => ['super_admin', 'admin'].includes(u.role.name)).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Todos os usuários cadastrados no sistema com suas respectivas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable
            users={users}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onResetPassword={handleResetPassword}
            onCreateNew={handleCreateNew}
          />
        </CardContent>
      </Card>
    </div>
  );
}
