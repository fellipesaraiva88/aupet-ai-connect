import { useState, useCallback, useEffect } from 'react';
import { useFormValidation, ValidationRule } from './useFormValidation';

export interface FormStep<T = Record<string, unknown>> {
  id: string;
  title: string;
  description?: string;
  fields: (keyof T)[];
  validation?: Partial<Record<keyof T, ValidationRule>>;
  isOptional?: boolean;
  customValidation?: (values: T) => Promise<boolean> | boolean;
}

interface UseMultiStepFormProps<T> {
  steps: FormStep<T>[];
  initialValues: T;
  validationRules: Partial<Record<keyof T, ValidationRule>>;
  onSubmit?: (values: T) => void | Promise<void>;
  autoSave?: boolean;
  autoSaveKey?: string;
  autoSaveDebounceMs?: number;
}

export function useMultiStepForm<T extends Record<string, unknown>>({
  steps,
  initialValues,
  validationRules,
  onSubmit,
  autoSave = true,
  autoSaveKey = 'form-autosave',
  autoSaveDebounceMs = 1000,
}: UseMultiStepFormProps<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize with autosaved data if available
  const getInitialValues = useCallback((): T => {
    if (autoSave && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          const parsedData = JSON.parse(saved);
          return { ...initialValues, ...parsedData };
        }
      } catch (error) {
        console.warn('Failed to load autosaved form data:', error);
      }
    }
    return initialValues;
  }, [initialValues, autoSave, autoSaveKey]);

  const formValidation = useFormValidation({
    initialValues: getInitialValues(),
    validationRules,
    onSubmit,
  });

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Auto-save functionality
  const performAutoSave = useCallback(
    (values: T) => {
      if (!autoSave || typeof window === 'undefined') return;

      try {
        localStorage.setItem(autoSaveKey, JSON.stringify(values));
      } catch (error) {
        console.warn('Failed to autosave form data:', error);
      }
    },
    [autoSave, autoSaveKey]
  );

  // Debounced auto-save
  useEffect(() => {
    if (!autoSave) return;

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      performAutoSave(formValidation.values);
    }, autoSaveDebounceMs);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [formValidation.values, autoSave, autoSaveDebounceMs, performAutoSave, autoSaveTimeout]);

  // Clear auto-save when form is successfully submitted
  const clearAutoSave = useCallback(() => {
    if (autoSave && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(autoSaveKey);
      } catch (error) {
        console.warn('Failed to clear autosaved form data:', error);
      }
    }
  }, [autoSave, autoSaveKey]);

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const currentStepFields = currentStep.fields;
    const currentStepRules: Partial<Record<keyof T, ValidationRule>> = {};

    // Get validation rules for current step fields only
    currentStepFields.forEach(field => {
      if (validationRules[field]) {
        currentStepRules[field] = validationRules[field];
      }
    });

    // Check field-level validation
    const fieldErrors = Object.keys(currentStepRules).map(field => {
      return formValidation.getFieldError(field as keyof T);
    }).filter(Boolean);

    if (fieldErrors.length > 0) {
      return false;
    }

    // Check custom step validation
    if (currentStep.customValidation) {
      try {
        const isValid = await currentStep.customValidation(formValidation.values);
        return isValid;
      } catch (error) {
        console.error('Custom validation error:', error);
        return false;
      }
    }

    return true;
  }, [currentStep, validationRules, formValidation]);

  // Navigate to specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, [steps.length]);

  // Go to next step
  const nextStep = useCallback(async () => {
    if (isLastStep) return false;

    const isValid = await validateCurrentStep();
    if (!isValid) return false;

    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
    return true;
  }, [isLastStep, validateCurrentStep, currentStepIndex, steps.length]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (isFirstStep) return false;
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    return true;
  }, [isFirstStep]);

  // Submit entire form
  const submitForm = useCallback(async () => {
    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.isOptional) continue;

      const stepFields = step.fields;
      const hasErrors = stepFields.some(field =>
        formValidation.hasFieldError(field)
      );

      if (hasErrors) {
        goToStep(i);
        return false;
      }

      // Run custom validation for this step
      if (step.customValidation) {
        try {
          const isValid = await step.customValidation(formValidation.values);
          if (!isValid) {
            goToStep(i);
            return false;
          }
        } catch (error) {
          console.error('Step validation error:', error);
          goToStep(i);
          return false;
        }
      }
    }

    // All validations passed, submit the form
    const success = await formValidation.handleSubmit();

    if (success) {
      clearAutoSave();
      setCompletedSteps(new Set(steps.map((_, index) => index)));
    }

    return success;
  }, [steps, formValidation, goToStep, clearAutoSave]);

  // Get step status
  const getStepStatus = useCallback((stepIndex: number): 'completed' | 'current' | 'upcoming' | 'error' => {
    if (completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === currentStepIndex) {
      // Check if current step has errors
      const stepFields = steps[stepIndex].fields;
      const hasErrors = stepFields.some(field =>
        formValidation.hasFieldError(field)
      );
      return hasErrors ? 'error' : 'current';
    }
    return 'upcoming';
  }, [completedSteps, currentStepIndex, steps, formValidation]);

  // Get progress percentage
  const getProgress = useCallback((): number => {
    const totalSteps = steps.length;
    const completedCount = completedSteps.size;
    const currentProgress = isLastStep && formValidation.isValid ? 1 : 0;
    return ((completedCount + currentProgress) / totalSteps) * 100;
  }, [steps.length, completedSteps.size, isLastStep, formValidation.isValid]);

  // Check if can proceed to next step
  const canProceed = useCallback((): boolean => {
    if (isLastStep) return formValidation.canSubmit;

    const currentStepFields = currentStep.fields;
    const hasRequiredFields = currentStepFields.some(field => {
      const rule = validationRules[field];
      return rule?.required;
    });

    if (!hasRequiredFields) return true;

    return currentStepFields.every(field => {
      const value = formValidation.values[field];
      const rule = validationRules[field];

      if (rule?.required) {
        return value && (typeof value !== 'string' || value.trim() !== '');
      }

      return !formValidation.hasFieldError(field);
    });
  }, [isLastStep, formValidation, currentStep, validationRules]);

  return {
    // Form state
    ...formValidation,

    // Step navigation
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    totalSteps: steps.length,
    completedSteps: Array.from(completedSteps),

    // Step actions
    nextStep,
    previousStep,
    goToStep,
    submitForm,

    // Step utilities
    getStepStatus,
    getProgress,
    canProceed: canProceed(),

    // Auto-save
    clearAutoSave,

    // Step data
    steps,

    // Field helpers for current step
    getCurrentStepFieldProps: (field: keyof T) => {
      if (!currentStep.fields.includes(field)) {
        console.warn(`Field ${String(field)} is not part of current step`);
      }
      return formValidation.getFieldProps(field);
    },

    getCurrentStepSelectProps: (field: keyof T) => {
      if (!currentStep.fields.includes(field)) {
        console.warn(`Field ${String(field)} is not part of current step`);
      }
      return formValidation.getSelectProps(field);
    },
  };
}