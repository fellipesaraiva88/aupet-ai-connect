import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, AlertCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiStepFormProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  getStepStatus: (stepIndex: number) => 'completed' | 'current' | 'upcoming' | 'error';
  onNext: () => Promise<boolean> | boolean;
  onPrevious: () => boolean;
  onGoToStep: (stepIndex: number) => void;
  onSubmit: () => Promise<boolean> | boolean;
  children: React.ReactNode;
  className?: string;
  showStepIndicator?: boolean;
  showProgress?: boolean;
  autoSaveIndicator?: boolean;
}

export function MultiStepForm({
  currentStep,
  totalSteps,
  steps,
  progress,
  isFirstStep,
  isLastStep,
  canProceed,
  isSubmitting,
  getStepStatus,
  onNext,
  onPrevious,
  onGoToStep,
  onSubmit,
  children,
  className,
  showStepIndicator = true,
  showProgress = true,
  autoSaveIndicator = true,
}: MultiStepFormProps) {
  const [isNextLoading, setIsNextLoading] = React.useState(false);

  const handleNext = async () => {
    setIsNextLoading(true);
    try {
      if (isLastStep) {
        await onSubmit();
      } else {
        await onNext();
      }
    } finally {
      setIsNextLoading(false);
    }
  };

  const getStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'current':
        return <Circle className="h-5 w-5 text-blue-600 fill-current" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStepBadgeVariant = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    switch (status) {
      case 'completed':
        return 'default';
      case 'error':
        return 'destructive';
      case 'current':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{Math.round(progress)}% completo</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Indicator */}
      {showStepIndicator && (
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  'flex flex-col items-center space-y-2 cursor-pointer transition-opacity',
                  getStepStatus(index) === 'upcoming' && 'opacity-50',
                  getStepStatus(index) === 'completed' && 'hover:opacity-80'
                )}
                onClick={() => {
                  if (getStepStatus(index) === 'completed') {
                    onGoToStep(index);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  {getStepIcon(index)}
                  <Badge variant={getStepBadgeVariant(index)} className="text-xs">
                    {index + 1}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{step.title}</div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground max-w-20 truncate">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-4 transition-colors',
                    getStepStatus(index) === 'completed'
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{steps[currentStep]?.title}</span>
            {autoSaveIndicator && (
              <Badge variant="outline" className="text-xs">
                Auto-salvo
              </Badge>
            )}
          </CardTitle>
          {steps[currentStep]?.description && (
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep || isSubmitting}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Anterior</span>
        </Button>

        <div className="flex items-center space-x-2">
          {!isLastStep && (
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} de {totalSteps}
            </span>
          )}

          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="flex items-center space-x-2"
          >
            {(isNextLoading || isSubmitting) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>{isLastStep ? 'Finalizar' : 'Próximo'}</span>
            {!isLastStep && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step content wrapper component
interface StepContentProps {
  children: React.ReactNode;
  className?: string;
}

export function StepContent({ children, className }: StepContentProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

// Form field group component
interface FieldGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldGroup({ title, description, children, className }: FieldGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}