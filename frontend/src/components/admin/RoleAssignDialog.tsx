import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role_id: string;
}

interface RoleAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  roles: Role[];
  onAssign: (userId: string, roleId: string) => Promise<void>;
}

export function RoleAssignDialog({
  open,
  onOpenChange,
  user,
  roles,
  onAssign,
}: RoleAssignDialogProps) {
  const { toast } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(user?.role_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const currentRole = roles.find((r) => r.id === user?.role_id);

  const handleAssign = async () => {
    if (!user || !selectedRoleId) return;

    setIsSubmitting(true);
    try {
      await onAssign(user.id, selectedRoleId);
      toast({
        title: 'Role atualizada',
        description: `A role de ${user.full_name} foi atualizada com sucesso.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar role',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atribuir Role</DialogTitle>
          <DialogDescription>
            Selecione uma nova role para {user.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">{user.full_name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">Role atual: </span>
                  <Badge variant="outline">{currentRole?.name || 'Sem role'}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Nova Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="py-1">
                      <div className="font-medium">{role.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {role.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRole && (
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-2">Permissões da Role</h4>
              <div className="flex flex-wrap gap-1">
                {selectedRole.permissions.slice(0, 8).map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
                {selectedRole.permissions.length > 8 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedRole.permissions.length - 8} mais
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isSubmitting || !selectedRoleId || selectedRoleId === user.role_id}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atribuir Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
