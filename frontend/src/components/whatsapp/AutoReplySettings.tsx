import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bot,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  MessageSquare,
  Zap,
  Heart,
  Settings,
  Calendar,
  AlertTriangle,
  Loader2,
  Save,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface AutoReply {
  id: string;
  instance_id: string;
  trigger_type: 'keyword' | 'welcome' | 'business_hours';
  trigger_value?: string;
  reply_message: string;
  reply_type: 'text' | 'image' | 'document';
  is_active: boolean;
  priority: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface AutoReplySettingsProps {
  organizationId: string;
  instanceId: string;
}

const triggerTypeLabels = {
  'keyword': 'Palavra-chave',
  'welcome': 'Mensagem de Boas-vindas',
  'business_hours': 'Fora do Horário Comercial'
};

const triggerTypeIcons = {
  'keyword': MessageSquare,
  'welcome': Heart,
  'business_hours': Clock
};

const triggerTypeColors = {
  'keyword': 'bg-blue-100 text-blue-700 border-blue-200',
  'welcome': 'bg-pink-100 text-pink-700 border-pink-200',
  'business_hours': 'bg-orange-100 text-orange-700 border-orange-200'
};

export const AutoReplySettings: React.FC<AutoReplySettingsProps> = ({
  organizationId,
  instanceId
}) => {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReply, setEditingReply] = useState<AutoReply | null>(null);
  const [creating, setCreating] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    trigger_type: 'keyword' as AutoReply['trigger_type'],
    trigger_value: '',
    reply_message: '',
    reply_type: 'text' as AutoReply['reply_type'],
    is_active: true,
    priority: 1
  });

  // Load auto-replies
  useEffect(() => {
    if (!instanceId || !organizationId) return;

    const loadAutoReplies = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('whatsapp_auto_replies' as any)
          .select('*')
          .eq('instance_id', instanceId)
          .eq('organization_id', organizationId)
          .order('priority', { ascending: false });

        if (error) throw error;

        setAutoReplies(data || []);
      } catch (error) {
        console.error('Error loading auto-replies:', error);
        toast({
          title: "Erro ao carregar auto-respostas",
          description: "Não conseguimos carregar as configurações de auto-resposta",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAutoReplies();
  }, [instanceId, organizationId]);

  // Filter auto-replies
  const filteredAutoReplies = autoReplies.filter(reply =>
    reply.reply_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reply.trigger_value && reply.trigger_value.toLowerCase().includes(searchQuery.toLowerCase())) ||
    triggerTypeLabels[reply.trigger_type].toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      trigger_type: 'keyword',
      trigger_value: '',
      reply_message: '',
      reply_type: 'text',
      is_active: true,
      priority: 1
    });
    setEditingReply(null);
  };

  // Handle create/update
  const handleSave = async () => {
    if (!formData.reply_message.trim()) {
      toast({
        title: "Mensagem de resposta obrigatória",
        description: "Por favor, insira a mensagem de resposta",
        variant: "destructive",
      });
      return;
    }

    if (formData.trigger_type === 'keyword' && !formData.trigger_value?.trim()) {
      toast({
        title: "Palavra-chave obrigatória",
        description: "Por favor, insira a palavra-chave que ativará a resposta",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const payload = {
        instance_id: instanceId,
        organization_id: organizationId,
        trigger_type: formData.trigger_type,
        trigger_value: formData.trigger_type === 'keyword' ? formData.trigger_value : null,
        reply_message: formData.reply_message,
        reply_type: formData.reply_type,
        is_active: formData.is_active,
        priority: formData.priority
      };

      if (editingReply) {
        // Update existing
        const { data, error } = await supabase
          .from('whatsapp_auto_replies' as any)
          .update(payload)
          .eq('id', editingReply.id)
          .select()
          .single();

        if (error) throw error;

        setAutoReplies(prev => prev.map(reply =>
          reply.id === editingReply.id ? data : reply
        ));

        toast({
          title: "Auto-resposta atualizada! ✨",
          description: "Configuração salva com sucesso",
        });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('whatsapp_auto_replies' as any)
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        setAutoReplies(prev => [data, ...prev]);

        toast({
          title: "Auto-resposta criada! 🤖",
          description: "Sua resposta automática foi configurada",
        });
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving auto-reply:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não conseguimos salvar a auto-resposta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Toggle active status
  const toggleActive = async (replyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('whatsapp_auto_replies' as any)
        .update({ is_active: !isActive })
        .eq('id', replyId);

      if (error) throw error;

      setAutoReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_active: !isActive } : reply
      ));

      toast({
        title: !isActive ? "Auto-resposta ativada! 🤖" : "Auto-resposta desativada",
        description: !isActive ? "Resposta automática está funcionando" : "Resposta automática foi pausada",
      });
    } catch (error) {
      console.error('Error toggling auto-reply:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não conseguimos alterar o status da auto-resposta",
        variant: "destructive",
      });
    }
  };

  // Delete auto-reply
  const deleteAutoReply = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_auto_replies' as any)
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      setAutoReplies(prev => prev.filter(reply => reply.id !== replyId));

      toast({
        title: "Auto-resposta removida",
        description: "Configuração foi deletada com sucesso",
      });
    } catch (error) {
      console.error('Error deleting auto-reply:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não conseguimos remover a auto-resposta",
        variant: "destructive",
      });
    }
  };

  // Edit auto-reply
  const editAutoReply = (reply: AutoReply) => {
    setFormData({
      trigger_type: reply.trigger_type,
      trigger_value: reply.trigger_value || '',
      reply_message: reply.reply_message,
      reply_type: reply.reply_type,
      is_active: reply.is_active,
      priority: reply.priority
    });
    setEditingReply(reply);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Auto-Respostas Inteligentes
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure respostas automáticas para melhorar o atendimento
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-primary hover:bg-gradient-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Auto-resposta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingReply ? 'Editar Auto-resposta' : 'Nova Auto-resposta'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trigger_type">Tipo de Gatilho</Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value: AutoReply['trigger_type']) =>
                      setFormData(prev => ({ ...prev, trigger_type: value, trigger_value: '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Palavra-chave</SelectItem>
                      <SelectItem value="welcome">Mensagem de Boas-vindas</SelectItem>
                      <SelectItem value="business_hours">Fora do Horário Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              {formData.trigger_type === 'keyword' && (
                <div>
                  <Label htmlFor="trigger_value">Palavra-chave</Label>
                  <Input
                    placeholder="ex: horario, preço, agendamento"
                    value={formData.trigger_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, trigger_value: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A resposta será enviada quando esta palavra aparecer na mensagem
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="reply_message">Mensagem de Resposta</Label>
                <Textarea
                  placeholder="Digite a mensagem que será enviada automaticamente..."
                  value={formData.reply_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, reply_message: e.target.value }))}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use variáveis: {{customerName}}, {{petName}}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Ativar auto-resposta</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={creating}>
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingReply ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar auto-respostas..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Auto-replies List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Carregando auto-respostas...
          </div>
        ) : filteredAutoReplies.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma auto-resposta configurada</p>
            <p className="text-sm">Crie sua primeira resposta automática!</p>
          </div>
        ) : (
          filteredAutoReplies.map((reply) => {
            const TriggerIcon = triggerTypeIcons[reply.trigger_type];
            return (
              <Card key={reply.id} className="glass-morphism">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={triggerTypeColors[reply.trigger_type]}>
                          <TriggerIcon className="h-3 w-3 mr-1" />
                          {triggerTypeLabels[reply.trigger_type]}
                        </Badge>
                        {reply.trigger_value && (
                          <Badge variant="outline" className="text-xs">
                            "{reply.trigger_value}"
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Prioridade {reply.priority}
                        </Badge>
                        {reply.usage_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {reply.usage_count} usos
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-2 line-clamp-2">
                        {reply.reply_message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Criado em {new Date(reply.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(reply.id, reply.is_active)}
                        className={reply.is_active ? "text-green-600" : "text-gray-400"}
                      >
                        {reply.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editAutoReply(reply)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta auto-resposta? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAutoReply(reply.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {autoReplies.length > 0 && (
        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {autoReplies.length}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {autoReplies.filter(r => r.is_active).length}
                </p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {autoReplies.reduce((sum, r) => sum + r.usage_count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Usos Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};