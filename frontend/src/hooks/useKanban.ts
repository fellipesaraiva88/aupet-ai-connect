import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface KanbanItem {
  id: string;
  type: 'customer' | 'pet';
  name: string;
  status: string;
  data: any;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: string[];
  color: string;
  icon: any;
  iconColor: string;
}

export function useKanban(data: KanbanItem[]) {
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null);
  const { toast } = useToast();

  const handleDragStart = useCallback((e: React.DragEvent, item: KanbanItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, columnStatuses: string[]) => {
    e.preventDefault();

    if (!draggedItem) return;

    try {
      // Here you would implement the actual status update logic
      console.log(`Moving ${draggedItem.name} to statuses:`, columnStatuses);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Item movido com sucesso! ✨",
        description: `${draggedItem.name} foi atualizado.`,
      });

      setDraggedItem(null);
    } catch (error) {
      toast({
        title: "Erro ao mover item",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [draggedItem, toast]);

  const getColumnItems = useCallback((columnStatuses: string[]) => {
    return data.filter(item => {
      // Special logic for unified view with mixed customer/pet data
      if (item.type === 'customer') {
        return columnStatuses.includes(item.status);
      } else {
        // Map pet statuses to column statuses
        if (columnStatuses.includes('active') && item.data.is_active) return true;
        if (columnStatuses.includes('needs_attention') && !item.data.is_active) return true;
        if (columnStatuses.includes('vaccination_due') && item.data.vaccination_status === 'overdue') return true;
        return columnStatuses.includes(item.status);
      }
    });
  }, [data]);

  return {
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    getColumnItems,
  };
}