import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
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
  MessageSquare,
  Plus,
  Search,
  Edit,
  Copy,
  Trash2,
  Eye,
  Tag,
  Zap,
  FileText,
  Heart,
  Calendar,
  ShoppingCart,
  AlertTriangle,
  Info,
  Gift,
  BookOpen,
  Loader2
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  description?: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

interface TemplateManagerProps {
  organizationId: string;
  onUseTemplate?: (template: Template) => void;
}

const categoryIcons = {
  'boas_vindas': Heart,
  'agendamento': Calendar,
  'produtos': ShoppingCart,
  'pos_atendimento': MessageSquare,
  'lembretes': AlertTriangle,
  'emergencia': Zap,
  'agradecimento': Gift,
  'promocoes': Tag,
  'informacoes': Info,
  'educativo': BookOpen,
  'general': FileText
};

const categoryColors = {
  'boas_vindas': 'bg-pink-100 text-pink-700 border-pink-200',
  'agendamento': 'bg-blue-100 text-blue-700 border-blue-200',
  'produtos': 'bg-green-100 text-green-700 border-green-200',
  'pos_atendimento': 'bg-purple-100 text-purple-700 border-purple-200',
  'lembretes': 'bg-orange-100 text-orange-700 border-orange-200',
  'emergencia': 'bg-red-100 text-red-700 border-red-200',
  'agradecimento': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'promocoes': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'informacoes': 'bg-gray-100 text-gray-700 border-gray-200',
  'educativo': 'bg-teal-100 text-teal-700 border-teal-200',
  'general': 'bg-slate-100 text-slate-700 border-slate-200'
};

export const TemplateManager: React.FC<TemplateManagerProps> = ({ organizationId, onUseTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'general',
    description: '',
    variables: [] as string[]
  });

  // Preview states
  const [previewContent, setPreviewContent] = useState('');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  // Carregar templates
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar template
  const createTemplate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Template criado! 🎉",
          description: "Novo template adicionado com sucesso",
        });

        setShowCreateModal(false);
        setFormData({
          name: '',
          content: '',
          category: 'general',
          description: '',
          variables: []
        });
        await loadTemplates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar template');
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({
        title: "Erro na criação",
        description: error instanceof Error ? error.message : "Falha ao criar template",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // Copiar template
  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Template copiado! 📋",
      description: "Conteúdo copiado para a área de transferência",
    });
  };

  // Preview template
  const previewTemplate = (template: Template) => {
    setSelectedTemplate(template);

    // Extrair variáveis do conteúdo
    const variableMatches = template.content.match(/\{\{(\w+)\}\}/g);
    const variables = variableMatches ?
      variableMatches.map(match => match.replace(/\{\{|\}\}/g, '')) : [];

    // Inicializar com valores de exemplo
    const exampleValues: Record<string, string> = {};
    variables.forEach(variable => {
      switch (variable) {
        case 'nome_pet':
          exampleValues[variable] = 'Rex';
          break;
        case 'data':
        case 'data1':
        case 'data2':
        case 'data3':
          exampleValues[variable] = '15/03/2024';
          break;
        case 'hora':
        case 'hora1':
        case 'hora2':
        case 'hora3':
          exampleValues[variable] = '14:30';
          break;
        case 'preco':
          exampleValues[variable] = '49,90';
          break;
        case 'veterinario':
          exampleValues[variable] = 'Dr. Silva';
          break;
        case 'telefone':
          exampleValues[variable] = '(11) 99999-9999';
          break;
        default:
          exampleValues[variable] = `[${variable}]`;
      }
    });

    setPreviewVariables(exampleValues);
    updatePreviewContent(template.content, exampleValues);
    setShowPreviewModal(true);
  };

  // Atualizar preview
  const updatePreviewContent = (content: string, variables: Record<string, string>) => {
    let preview = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      preview = preview.replace(regex, value);
    });
    setPreviewContent(preview);
  };

  // Detectar variáveis no conteúdo
  const detectVariables = (content: string) => {
    const variableMatches = content.match(/\{\{(\w+)\}\}/g);
    return variableMatches ?
      variableMatches.map(match => match.replace(/\{\{|\}\}/g, '')) : [];
  };

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Categorias disponíveis
  const categories = Array.from(new Set(templates.map(t => t.category)));

  useEffect(() => {
    loadTemplates();
  }, []);

  // Atualizar variáveis quando o conteúdo muda
  useEffect(() => {
    const variables = detectVariables(formData.content);
    setFormData(prev => ({ ...prev, variables }));
  }, [formData.content]);

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category as keyof typeof categoryIcons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryBadge = (category: string) => {
    const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.general;
    return (
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        {getCategoryIcon(category)}
        <span className="ml-1 capitalize">{category.replace('_', ' ')}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Preparando modelos pet... 🐕</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Templates de Mensagens
          </h2>
          <p className="text-muted-foreground">
            Gerencie templates para respostas automáticas e envios rápidos
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: boas_vindas_especial"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
                      <SelectItem value="agendamento">Agendamento</SelectItem>
                      <SelectItem value="produtos">Produtos</SelectItem>
                      <SelectItem value="pos_atendimento">Pós-atendimento</SelectItem>
                      <SelectItem value="lembretes">Lembretes</SelectItem>
                      <SelectItem value="emergencia">Emergência</SelectItem>
                      <SelectItem value="agradecimento">Agradecimento</SelectItem>
                      <SelectItem value="promocoes">Promoções</SelectItem>
                      <SelectItem value="informacoes">Informações</SelectItem>
                      <SelectItem value="educativo">Educativo</SelectItem>
                      <SelectItem value="general">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva quando usar este template"
                />
              </div>

              <div>
                <Label htmlFor="content">Conteúdo da Mensagem</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o conteúdo da mensagem... Use {{variavel}} para campos dinâmicos"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {`{{customerName}}, {{petName}}`} para criar variáveis dinâmicas
                </p>
              </div>

              {formData.variables.length > 0 && (
                <div>
                  <Label>Variáveis Detectadas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.variables.map(variable => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={createTemplate} disabled={creating} className="flex-1">
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Criar Template
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de templates */}
      <div className="grid gap-4">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Nenhum template encontrado com os filtros aplicados'
                  : 'Nenhum template configurado ainda'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="glass-morphism">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      {getCategoryBadge(template.category)}
                      <Badge variant="outline" className="text-xs">
                        {template.usage_count} usos
                      </Badge>
                    </div>

                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    )}

                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                      {template.content}
                    </p>

                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.variables.slice(0, 3).map(variable => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.variables.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Preview */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                {getCategoryBadge(selectedTemplate.category)}
                <Badge variant="outline">
                  {selectedTemplate.usage_count} usos
                </Badge>
              </div>

              {Object.keys(previewVariables).length > 0 && (
                <div>
                  <Label>Variáveis (edite para ver o resultado)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {Object.entries(previewVariables).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-xs">{key}</Label>
                        <Input
                          value={value}
                          onChange={(e) => {
                            const newVariables = { ...previewVariables, [key]: e.target.value };
                            setPreviewVariables(newVariables);
                            updatePreviewContent(selectedTemplate.content, newVariables);
                          }}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Preview da Mensagem</Label>
                <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="whitespace-pre-wrap text-sm">
                      {previewContent}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => copyTemplate(selectedTemplate)}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Template
                </Button>
                {onUseTemplate && (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => {
                      onUseTemplate(selectedTemplate!);
                      setShowPreviewModal(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Usar Template
                  </Button>
                )}
                <Button onClick={() => setShowPreviewModal(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};