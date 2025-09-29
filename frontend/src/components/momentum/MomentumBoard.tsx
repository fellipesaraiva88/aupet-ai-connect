import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Thermometer, 
  Heart, 
  Snowflake, 
  Search, 
  Filter,
  TrendingUp,
  Eye,
  Target
} from "lucide-react";
import MomentumCard, { MomentumData } from "./MomentumCard";
import { cn } from "@/lib/utils";

interface MomentumBoardProps {
  data: MomentumData[];
  onAction: (action: string, data: MomentumData) => void;
  loading?: boolean;
}

type MomentumFilter = 'all' | 'hot' | 'warm' | 'cold';

const MomentumBoard: React.FC<MomentumBoardProps> = ({ data, onAction, loading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<MomentumFilter>('all');

  // Filter and organize data by momentum
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply momentum filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.momentum === filter);
    }

    return filtered;
  }, [data, searchQuery, filter]);

  // Organize by momentum type
  const organizedData = useMemo(() => {
    const hot = filteredData.filter(item => item.momentum === 'hot').sort((a, b) => b.score - a.score);
    const warm = filteredData.filter(item => item.momentum === 'warm').sort((a, b) => b.score - a.score);
    const cold = filteredData.filter(item => item.momentum === 'cold').sort((a, b) => b.score - a.score);

    return { hot, warm, cold };
  }, [filteredData]);

  // Statistics
  const stats = useMemo(() => {
    const total = data.length;
    const hot = data.filter(item => item.momentum === 'hot').length;
    const warm = data.filter(item => item.momentum === 'warm').length;
    const cold = data.filter(item => item.momentum === 'cold').length;
    const totalValue = data.reduce((sum, item) => sum + item.potentialValue, 0);

    return { total, hot, warm, cold, totalValue };
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getColumnConfig = (type: 'hot' | 'warm' | 'cold') => {
    switch (type) {
      case 'hot':
        return {
          title: 'Momentum Quente',
          subtitle: 'Prontos para comprar',
          icon: <Thermometer className="h-5 w-5 text-red-500" />,
          gradient: 'from-red-500/10 to-orange-500/10',
          borderColor: 'border-red-200 dark:border-red-800',
          count: organizedData.hot.length,
          items: organizedData.hot,
        };
      case 'warm':
        return {
          title: 'Momentum Morno',
          subtitle: 'Demonstrando interesse',
          icon: <Heart className="h-5 w-5 text-amber-500" />,
          gradient: 'from-amber-500/10 to-yellow-500/10',
          borderColor: 'border-amber-200 dark:border-amber-800',
          count: organizedData.warm.length,
          items: organizedData.warm,
        };
      case 'cold':
        return {
          title: 'Momentum Frio',
          subtitle: 'Relacionamento inicial',
          icon: <Snowflake className="h-5 w-5 text-blue-500" />,
          gradient: 'from-blue-500/10 to-slate-500/10',
          borderColor: 'border-blue-200 dark:border-blue-800',
          count: organizedData.cold.length,
          items: organizedData.cold,
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading header */}
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="flex gap-4">
            <div className="h-6 bg-muted rounded w-24"></div>
            <div className="h-6 bg-muted rounded w-24"></div>
            <div className="h-6 bg-muted rounded w-24"></div>
          </div>
        </div>

        {/* Loading grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(col => (
            <div key={col} className="space-y-4">
              <div className="h-16 bg-muted rounded-lg animate-pulse"></div>
              {[1, 2, 3].map(card => (
                <div key={card} className="h-32 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Centro de Momentum de Compra
            </h1>
            <p className="text-muted-foreground">
              Sistema inteligente de atendimento baseado no momento da compra
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background">
              <Eye className="h-4 w-4 mr-1" />
              {stats.total} clientes
            </Badge>
            <Badge variant="outline" className="bg-background">
              <Target className="h-4 w-4 mr-1" />
              {formatCurrency(stats.totalValue)}
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, pet ou mensagem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              Todos ({stats.total})
            </Button>
            <Button
              variant={filter === 'hot' ? 'default' : 'outline'}
              onClick={() => setFilter('hot')}
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🔥 {stats.hot}
            </Button>
            <Button
              variant={filter === 'warm' ? 'default' : 'outline'}
              onClick={() => setFilter('warm')}
              size="sm"
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              🌡️ {stats.warm}
            </Button>
            <Button
              variant={filter === 'cold' ? 'default' : 'outline'}
              onClick={() => setFilter('cold')}
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              ❄️ {stats.cold}
            </Button>
          </div>
        </div>
      </div>

      {/* Momentum Columns */}
      {filter === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(['hot', 'warm', 'cold'] as const).map(type => {
            const config = getColumnConfig(type);
            return (
              <div key={type} className="space-y-4">
                {/* Column Header */}
                <div className={cn(
                  "p-4 rounded-lg border glass-morphism",
                  `bg-gradient-to-r ${config.gradient}`,
                  config.borderColor
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {config.icon}
                      <div>
                        <h3 className="font-semibold">{config.title}</h3>
                        <p className="text-sm text-muted-foreground">{config.subtitle}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {config.count}
                    </Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                  {config.items.map(item => (
                    <MomentumCard
                      key={item.id}
                      data={item}
                      onAction={onAction}
                      className="transition-all duration-200 hover:scale-[1.02]"
                    />
                  ))}
                  
                  {config.items.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="opacity-50 mb-2">
                        {config.icon}
                      </div>
                      <p className="text-sm">Nenhum cliente neste momentum</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map(item => (
            <MomentumCard
              key={item.id}
              data={item}
              onAction={onAction}
              className="max-w-md"
            />
          ))}
          
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou termo de busca
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MomentumBoard;