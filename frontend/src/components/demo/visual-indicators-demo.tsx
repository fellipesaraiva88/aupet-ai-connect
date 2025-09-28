import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { EnhancedProgress, CircularProgress, ProgressSteps } from '@/components/ui/enhanced-progress';
import {
  FeedbackButton,
  PulseIndicator,
  CounterAnimation,
  RippleEffect,
  HoverCard,
  FloatingActionButton
} from '@/components/ui/micro-interactions';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PetCardSkeleton,
  AppointmentCardSkeleton,
  StatCardSkeleton,
  DashboardSkeleton
} from '@/components/ui/optimized-skeleton';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';
import { useLoading } from '@/contexts/LoadingContext';
import { Play, Heart, Zap, Star, Plus } from 'lucide-react';

export const VisualIndicatorsDemo: React.FC = () => {
  const [progress, setProgress] = useState(45);
  const [counter, setCounter] = useState(150);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();
  const { toast } = useEnhancedToast();

  const progressSteps = [
    { label: 'Análise inicial', completed: true },
    { label: 'Processamento', completed: true },
    { label: 'Validação', completed: false, current: true },
    { label: 'Finalização', completed: false }
  ];

  const handleToastDemo = (type: 'success' | 'error' | 'warning' | 'info' | 'loading') => {
    const messages = {
      success: { title: 'Sucesso!', description: 'Operação realizada com sucesso.' },
      error: { title: 'Erro!', description: 'Algo deu errado. Tente novamente.' },
      warning: { title: 'Atenção!', description: 'Verifique os dados antes de continuar.' },
      info: { title: 'Informação', description: 'Nova atualização disponível.' },
      loading: { title: 'Carregando...', description: 'Processando sua solicitação.' }
    };

    toast[type](messages[type].title, messages[type].description);
  };

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const handleGlobalLoadingDemo = () => {
    setGlobalLoading('demo', true);
    setTimeout(() => setGlobalLoading('demo', false), 2000);
  };

  const handleSkeletonDemo = () => {
    setShowSkeleton(true);
    setTimeout(() => setShowSkeleton(false), 3000);
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Demonstração dos Indicadores Visuais</h1>
        <p className="text-muted-foreground">
          Explore todos os novos componentes de UX implementados
        </p>
      </div>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Estados de Carregamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <LoadingButton
              loading={loading}
              onClick={handleLoadingDemo}
              icon={<Play className="h-4 w-4" />}
              loadingText="Processando..."
            >
              Teste Loading Button
            </LoadingButton>

            <Button onClick={handleGlobalLoadingDemo}>
              Teste Loading Global
            </Button>
          </div>

          <LoadingOverlay
            isVisible={loading}
            message="Processando demonstração..."
            variant="default"
          />
        </CardContent>
      </Card>

      {/* Progress Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Progresso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setProgress(Math.max(0, progress - 10))}
                variant="outline"
                size="sm"
              >
                -10%
              </Button>
              <Button
                onClick={() => setProgress(Math.min(100, progress + 10))}
                variant="outline"
                size="sm"
              >
                +10%
              </Button>
            </div>

            <EnhancedProgress
              value={progress}
              variant="gradient"
              showValue
              label="Progresso Animado"
              animated
              striped
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CircularProgress
                value={progress}
                variant="success"
                label="Taxa de Sucesso"
              />
              <CircularProgress
                value={75}
                variant="warning"
                label="Eficiência"
              />
              <CircularProgress
                value={90}
                variant="default"
                label="Satisfação"
              />
            </div>

            <ProgressSteps steps={progressSteps} variant="horizontal" />
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações Toast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <FeedbackButton
              variant="success"
              onClick={() => handleToastDemo('success')}
            >
              Sucesso
            </FeedbackButton>
            <FeedbackButton
              variant="error"
              onClick={() => handleToastDemo('error')}
            >
              Erro
            </FeedbackButton>
            <FeedbackButton
              variant="warning"
              onClick={() => handleToastDemo('warning')}
            >
              Aviso
            </FeedbackButton>
            <FeedbackButton
              variant="info"
              onClick={() => handleToastDemo('info')}
            >
              Info
            </FeedbackButton>
            <Button onClick={() => handleToastDemo('loading')}>
              Loading
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Micro-interactions */}
      <Card>
        <CardHeader>
          <CardTitle>Micro-interações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Animações de Contadores</h4>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setCounter(Math.floor(Math.random() * 1000))}
                  variant="outline"
                >
                  Novo Valor
                </Button>
                <div className="text-2xl font-bold">
                  <CounterAnimation value={counter} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Indicadores de Pulse</h4>
              <div className="flex items-center gap-4">
                <PulseIndicator active color="bg-green-500" size="lg" />
                <span>Sistema Online</span>
              </div>
              <div className="flex items-center gap-4">
                <PulseIndicator active color="bg-yellow-500" size="md" />
                <span>Processando</span>
              </div>
              <div className="flex items-center gap-4">
                <PulseIndicator active={false} color="bg-gray-500" size="sm" />
                <span>Offline</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Efeito Ripple</h4>
            <RippleEffect className="inline-block">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <Heart className="h-6 w-6 text-red-500" />
                  <span>Clique para ver o efeito ripple</span>
                </div>
              </Card>
            </RippleEffect>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Hover Card</h4>
            <HoverCard
              hoverContent={
                <div className="text-sm">
                  <p className="font-semibold">Informações Adicionais</p>
                  <p className="text-muted-foreground">
                    Este é um exemplo de conteúdo que aparece no hover.
                  </p>
                </div>
              }
            >
              <Card className="p-4 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>Passe o mouse aqui</span>
                </div>
              </Card>
            </HoverCard>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Screens */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton Screens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSkeletonDemo}>
            Demonstrar Skeletons
          </Button>

          {showSkeleton ? (
            <div className="space-y-6">
              <DashboardSkeleton />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PetCardSkeleton />
                <StatCardSkeleton />
                <AppointmentCardSkeleton />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Clique no botão acima para ver os skeleton screens em ação.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full" variant="shimmer" />
                <Skeleton className="h-32 w-full" variant="wave" />
                <Skeleton className="h-32 w-full" variant="pulse" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<Plus className="h-6 w-6" />}
        onClick={() => toast.success('FAB Clicado!', 'Você clicou no botão flutuante')}
        variant="primary"
        position="bottom-right"
      />
    </div>
  );
};