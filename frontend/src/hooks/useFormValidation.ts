import { useState, useCallback, useMemo } from "react";

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface FieldError {
  field: string;
  message: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
}

interface UseFormValidationProps<T> {
  initialValues: T;
  validationRules: Partial<Record<keyof T, ValidationRule>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit
}: UseFormValidationProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [touched, setTouched] = useState<Set<keyof T>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: keyof T, value: any): FieldError | null => {
    const rules = validationRules[field];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return {
        field: String(field),
        message: rules.message || `${String(field)} é obrigatório`,
        type: 'required'
      };
    }

    // Only validate other rules if value exists
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        return {
          field: String(field),
          message: rules.message || `${String(field)} deve ter pelo menos ${rules.minLength} caracteres`,
          type: 'minLength'
        };
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        return {
          field: String(field),
          message: rules.message || `${String(field)} deve ter no máximo ${rules.maxLength} caracteres`,
          type: 'maxLength'
        };
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return {
          field: String(field),
          message: rules.message || `${String(field)} possui formato inválido`,
          type: 'pattern'
        };
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return {
          field: String(field),
          message: customError,
          type: 'custom'
        };
      }
    }

    return null;
  }, [validationRules]);

  const validateAllFields = useCallback((): FieldError[] => {
    const newErrors: FieldError[] = [];

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field as keyof T, values[field as keyof T]);
      if (error) {
        newErrors.push(error);
      }
    });

    return newErrors;
  }, [values, validateField, validationRules]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Real-time validation for touched fields
    if (touched.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => {
        const filtered = prev.filter(e => e.field !== String(field));
        return error ? [...filtered, error] : filtered;
      });
    }
  }, [touched, validateField]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => new Set(prev).add(field));

    // Validate when field is touched
    const error = validateField(field, values[field]);
    setErrors(prev => {
      const filtered = prev.filter(e => e.field !== String(field));
      return error ? [...filtered, error] : filtered;
    });
  }, [values, validateField]);

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    const error = errors.find(e => e.field === String(field));
    return error?.message;
  }, [errors]);

  const hasFieldError = useCallback((field: keyof T): boolean => {
    return errors.some(e => e.field === String(field));
  }, [errors]);

  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return touched.has(field);
  }, [touched]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors([]);
    setTouched(new Set());
    setIsSubmitting(false);
  }, [initialValues]);

  const resetField = useCallback((field: keyof T) => {
    setValues(prev => ({ ...prev, [field]: initialValues[field] }));
    setErrors(prev => prev.filter(e => e.field !== String(field)));
    setTouched(prev => {
      const newTouched = new Set(prev);
      newTouched.delete(field);
      return newTouched;
    });
  }, [initialValues]);

  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    setIsSubmitting(true);

    // Validate all fields
    const allErrors = validateAllFields();
    setErrors(allErrors);

    // Mark all fields as touched
    setTouched(new Set(Object.keys(validationRules) as (keyof T)[]));

    if (allErrors.length === 0 && onSubmit) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }

    setIsSubmitting(false);
    return allErrors.length === 0;
  }, [values, validateAllFields, onSubmit, validationRules]);

  // Computed values
  const isValid = useMemo(() => errors.length === 0, [errors]);
  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => values[key] !== initialValues[key]);
  }, [values, initialValues]);
  const canSubmit = useMemo(() => isValid && !isSubmitting, [isValid, isSubmitting]);

  return {
    // Values
    values,
    errors,
    touched: Array.from(touched),
    isSubmitting,
    isValid,
    isDirty,
    canSubmit,

    // Field helpers
    setValue,
    setFieldTouched,
    getFieldError,
    hasFieldError,
    isFieldTouched,

    // Form helpers
    handleSubmit,
    resetForm,
    resetField,
    validateAllFields,

    // Field props generators
    getFieldProps: (field: keyof T) => ({
      value: values[field] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValue(field, e.target.value),
      onBlur: () => setFieldTouched(field),
      error: hasFieldError(field),
      helperText: getFieldError(field),
    }),

    getSelectProps: (field: keyof T) => ({
      value: values[field] || '',
      onValueChange: (value: any) => setValue(field, value),
      onOpenChange: (open: boolean) => {
        if (!open) setFieldTouched(field);
      },
    }),
  };
}

// Common validation rules
export const validationRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message
  }),

  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'Email inválido'
  }),

  phone: (message?: string): ValidationRule => ({
    pattern: /^[\d\s\-\(\)]+$/,
    message: message || 'Telefone inválido'
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    minLength: min,
    message: message || `Deve ter pelo menos ${min} caracteres`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    maxLength: max,
    message: message || `Deve ter no máximo ${max} caracteres`
  }),

  positiveNumber: (message?: string): ValidationRule => ({
    custom: (value) => {
      const num = parseFloat(value);
      return isNaN(num) || num <= 0 ? (message || 'Deve ser um número positivo') : null;
    }
  }),

  age: (message?: string): ValidationRule => ({
    custom: (value) => {
      const agePattern = /^\d+\s*(anos?|meses?|ano|mês)$/i;
      return !agePattern.test(value) ? (message || 'Formato: "2 anos" ou "6 meses"') : null;
    }
  }),

  weight: (message?: string): ValidationRule => ({
    custom: (value) => {
      const weightPattern = /^\d+(\.\d+)?\s*(kg|g)?$/i;
      return !weightPattern.test(value) ? (message || 'Formato: "5.5kg" ou "2.5"') : null;
    }
  })
};