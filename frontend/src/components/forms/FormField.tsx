import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseFieldProps {
  id: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  autoComplete?: string;
  maxLength?: number;
}

interface PasswordFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  showStrength?: boolean;
  autoComplete?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

interface RadioGroupFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  orientation?: 'horizontal' | 'vertical';
}

// Password strength calculator
const calculatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 25;
  else feedback.push('Pelo menos 8 caracteres');

  if (/[a-z]/.test(password)) score += 25;
  else feedback.push('Letra minúscula');

  if (/[A-Z]/.test(password)) score += 25;
  else feedback.push('Letra maiúscula');

  if (/\d/.test(password)) score += 25;
  else feedback.push('Número');

  if (/[@$!%*?&]/.test(password)) score += 25;
  else feedback.push('Símbolo especial');

  if (password.length >= 12) score += 25;

  return { score: Math.min(score, 100), feedback };
};

// Base field wrapper
const FieldWrapper: React.FC<{
  id: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ id, label, description, error, required, className, children }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className={cn('text-sm font-medium', error && 'text-red-600')}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {description && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          {description}
        </p>
      )}

      {children}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1 text-sm text-red-600"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Input Field Component
export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  className,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  icon,
  suffix,
  disabled,
  autoComplete,
  maxLength,
}) => {
  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={cn(
            icon && 'pl-10',
            suffix && 'pr-10',
            error && 'border-red-500 focus:ring-red-500',
            'transition-colors'
          )}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

// Password Field Component
export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label = 'Senha',
  description,
  error,
  required,
  className,
  placeholder = 'Digite sua senha',
  value,
  onChange,
  onBlur,
  showStrength = false,
  disabled,
  autoComplete = 'current-password',
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const strength = showStrength ? calculatePasswordStrength(value) : null;

  const getStrengthColor = (score: number) => {
    if (score < 25) return 'bg-red-500';
    if (score < 50) return 'bg-orange-500';
    if (score < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score < 25) return 'Fraca';
    if (score < 50) return 'Regular';
    if (score < 75) return 'Boa';
    return 'Forte';
  };

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            'pr-10',
            error && 'border-red-500 focus:ring-red-500',
            'transition-colors'
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {showStrength && strength && value && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Força da senha:</span>
            <span className={cn(
              'font-medium',
              strength.score < 50 ? 'text-red-600' : strength.score < 75 ? 'text-yellow-600' : 'text-green-600'
            )}>
              {getStrengthText(strength.score)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all', getStrengthColor(strength.score))}
              style={{ width: `${strength.score}%` }}
            />
          </div>
          {strength.feedback.length > 0 && (
            <div className="text-xs text-gray-600">
              Faltam: {strength.feedback.join(', ')}
            </div>
          )}
        </div>
      )}
    </FieldWrapper>
  );
};

// Textarea Field Component
export const TextareaField: React.FC<TextareaFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  className,
  placeholder,
  value,
  onChange,
  onBlur,
  rows = 3,
  disabled,
  maxLength,
}) => {
  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            error && 'border-red-500 focus:ring-red-500',
            'transition-colors resize-none'
          )}
        />
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

// Select Field Component
export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  className,
  placeholder = 'Selecione uma opção',
  value,
  onChange,
  onBlur,
  options,
  disabled,
}) => {
  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Select
        value={value}
        onValueChange={onChange}
        onOpenChange={(open) => !open && onBlur?.()}
        disabled={disabled}
      >
        <SelectTrigger className={cn(error && 'border-red-500')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
};

// Checkbox Field Component
export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  id,
  label,
  description,
  error,
  className,
  checked,
  onChange,
  children,
  disabled,
}) => {
  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      className={className}
    >
      <div className="flex items-start space-x-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          className={cn(error && 'border-red-500')}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor={id}
            className={cn(
              'text-sm font-normal cursor-pointer',
              error && 'text-red-600',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {children}
          </Label>
        </div>
      </div>
    </FieldWrapper>
  );
};

// Radio Group Field Component
export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  className,
  value,
  onChange,
  options,
  orientation = 'vertical',
  disabled,
}) => {
  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className={cn(
          'gap-3',
          orientation === 'horizontal' ? 'flex flex-wrap' : 'space-y-3'
        )}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${id}-${option.value}`}
              className={cn(error && 'border-red-500')}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={`${id}-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
              {option.description && (
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
    </FieldWrapper>
  );
};