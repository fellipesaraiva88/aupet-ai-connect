import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/admin/UserTable';
import { Users as UsersIcon, Download, Upload } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAdminUsers } from '@/hooks/useAdminUsers';

export default function UserManagement() {
  const {
    users,
    isLoading,
    updateUser,
    deleteUser,
    isUpdating,
    isDeleting,
  } = useAdminUsers();

  const handleEdit = async (user: any) => {
    try {
      // In a real implementation, this would open a modal with the user data
      // For now, we'll just show a toast
      toast.info('Editar Usuário', {
        description: `Editando ${user.email}. Funcionalidade de edição será implementada em breve.`
      });
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível editar o usuário.'
      });
    }
  };

  const handleDelete = async (user: any) => {
    try {
      const action = user.is_active ? 'desativar' : 'reativar';

      // Show confirmation toast
      toast.warning('Confirmar Ação', {
        description: `Deseja ${action} ${user.email}?`,
        action: {
          label: 'Confirmar',
          onClick: async () => {
            await deleteUser(user.id);
          }
        }
      });
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível realizar a ação.'
      });
    }
  };

  const handleResetPassword = async (user: any) => {
    try {
      // This would call a password reset endpoint
      toast.info('Recuperação de Senha', {
        description: `Funcionalidade de reset de senha será implementada em breve para ${user.email}.`
      });
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível enviar o link de recuperação.'
      });
    }
  };

  const handleCreateNew = () => {
    // In a real implementation, this would open a create user modal
    toast.info('Novo Usuário', {
      description: 'Modal de criação de usuário será implementado em breve.'
    });
  };

  const handleExport = () => {
    try {
      if (!users || users.length === 0) {
        toast.warning('Sem Dados', {
          description: 'Não há usuários para exportar.'
        });
        return;
      }

      // Export users to CSV
      const csv = [
        ['ID', 'Email', 'Nome', 'Role', 'Organização', 'Status', 'Último Login', 'Criado Em'].join(','),
        ...users.map(u => [
          u.id,
          u.email,
          u.full_name,
          u.role?.name || '',
          u.organization?.name || '',
          u.is_active ? 'Ativo' : 'Inativo',
          u.last_login || '',
          u.created_at
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios_${new Date().toISOString()}.csv`;
      a.click();

      toast.success('Exportado', {
        description: 'Arquivo CSV baixado com sucesso.'
      });
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível exportar os usuários.'
      });
    }
  };

  const handleImport = () => {
    toast.info('Importar', {
      description: 'Funcionalidade de importação será implementada em breve.'
    });
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
          <Button variant="outline" onClick={handleExport} disabled={!users || users.length === 0}>
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
            <CardTitle className="text-3xl">{users?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários Ativos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {users?.filter(u => u.is_active).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários Inativos</CardDescription>
            <CardTitle className="text-3xl text-gray-600">
              {users?.filter(u => !u.is_active).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {users?.filter(u => ['super_admin', 'admin'].includes(u.role?.name || '')).length || 0}
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
            users={users || []}
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
