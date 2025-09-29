import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { PersonalityStep } from "./steps/PersonalityStep";
import { BehaviorStep } from "./steps/BehaviorStep";
import { TestStep } from "./steps/TestStep";
import { ActivationStep } from "./steps/ActivationStep";

interface OnboardingData {
  assistantName: string;
  personality: string;
  tone: string;
  avatar: string;
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  services: string[];
  automations: Record<string, boolean>;
  systemPrompt: string;
  temperature: number;
  responseDelay: number;
}

const STEPS = [
  { id: 'welcome', title: 'Bem-vinda', component: WelcomeStep },
  { id: 'personality', title: 'Personalidade', component: PersonalityStep },
  { id: 'behavior', title: 'Comportamento', component: BehaviorStep },
  { id: 'test', title: 'Teste', component: TestStep },
  { id: 'activation', title: 'Ativação', component: ActivationStep },
];

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    assistantName: "Assistente Auzap",
    personality: "friendly",
    tone: "professional",
    avatar: "default",
    businessHours: {
      enabled: true,
      start: "08:00",
      end: "18:00",
    },
    services: ["consulta", "banho", "tosa"],
    automations: {
      autoReply: true,
      scheduleAppointments: true,
      priceInfo: true,
      customerSupport: true,
    },
    systemPrompt: "",
    temperature: 0.7,
    responseDelay: 2,
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    onComplete(onboardingData);
  }, [onboardingData, onComplete]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-primary p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Configuração da Assistente Auzap</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm opacity-80">
              <span>Passo {currentStep + 1} de {STEPS.length}</span>
              <span>{STEPS[currentStep].title}</span>
            </div>
            <Progress value={progress} className="bg-white/20 h-2" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                data={onboardingData}
                updateData={updateData}
                nextStep={nextStep}
                prevStep={prevStep}
                onComplete={handleComplete}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {currentStep > 0 && currentStep < STEPS.length - 1 && (
          <div className="border-t p-4 flex items-center justify-between flex-shrink-0 bg-background">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              onClick={nextStep}
              disabled={currentStep === STEPS.length - 1}
              className="flex items-center gap-2 bg-gradient-primary text-white"
              size="sm"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};