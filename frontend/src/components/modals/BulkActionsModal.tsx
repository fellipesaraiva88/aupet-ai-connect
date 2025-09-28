import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Trash, Edit, MessageSquare, Loader2 } from "lucide-react";

interface BulkActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: string[];
  onComplete: () => void;
}

export function BulkActionsModal({ open, onOpenChange, selectedItems, onComplete }: BulkActionsModalProps) {
  const [action, setAction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExecute = async () => {
    if (!action) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (action) {
        case "export":
          toast({
            title: "Exportação concluída! 📁",
            description: `${selectedItems.length} itens foram exportados com sucesso.`,
          });
          break;
        case "delete":
          toast({
            title: "Itens removidos",
            description: `${selectedItems.length} itens foram removidos.`,
          });
          break;
        case "status_active":
          toast({
            title: "Status atualizado",
            description: `${selectedItems.length} itens marcados como ativos.`,
          });
          break;
        case "status_inactive":
          toast({
            title: "Status atualizado",
            description: `${selectedItems.length} itens marcados como inativos.`,
          });
          break;
      }

      onComplete();
    } catch (error) {
      toast({
        title: "Erro na operação",
        description: "Não foi possível executar a ação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const actionOptions = [
    { value: "export", label: "Exportar para CSV", icon: Download },
    { value: "status_active", label: "Marcar como Ativo", icon: Edit },
    { value: "status_inactive", label: "Marcar como Inativo", icon: Edit },
    { value: "send_message", label: "Enviar Mensagem", icon: MessageSquare },
    { value: "delete", label: "Excluir", icon: Trash, destructive: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ações em Lote</DialogTitle>
          <DialogDescription>
            Executar ação para {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selecionado{selectedItems.length > 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione uma ação:</label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma ação..." />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={option.destructive ? "text-destructive" : ""}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {action === "delete" && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                ⚠️ Esta ação não pode ser desfeita. Os itens serão removidos permanentemente.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!action || isLoading}
            variant={action === "delete" ? "destructive" : "default"}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Executar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}