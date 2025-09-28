import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMultiStepForm, FormStep } from '@/hooks/useMultiStepForm';
import { validationRules } from '@/hooks/useFormValidation';
import { MultiStepForm, StepContent, FieldGroup } from '@/components/ui/multi-step-form';
import {
  InputField,
  PasswordField,
  SelectField,
  TextareaField,
  CheckboxField,
} from '@/components/forms/FormField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building, Mail, Check } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://auzap-backend.onrender.com';

interface SignupFormData {
  // Step 1: Personal Information
  fullName: string;
  email: string;
  phone?: string;

  // Step 2: Account Security
  password: string;
  confirmPassword: string;

  // Step 3: Organization Details
  organizationName: string;
  organizationType: 'veterinary' | 'pet_shop' | 'grooming' | 'daycare' | 'other';
  organizationSize: '1-5' | '6-20' | '21-50' | '51-100' | '100+';
  website?: string;

  // Step 4: Subscription & Preferences
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  businessHours?: string;
  specialties?: string[];
  marketingOptIn: boolean;
}

interface SignupResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      organizationId: string;
      organization: {
        id: string;
        name: string;
        slug: string;
        subscription_tier: string;
      };
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    needsEmailVerification?: boolean;
  };
  error?: string;
}

const initialValues: SignupFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  organizationType: 'veterinary',
  organizationSize: '1-5',
  website: '',
  subscriptionTier: 'free',
  businessHours: '',
  specialties: [],
  marketingOptIn: false,
};

const formSteps: FormStep<SignupFormData>[] = [
  {
    id: 'personal',
    title: 'Informações Pessoais',
    description: 'Seus dados básicos',
    fields: ['fullName', 'email', 'phone'],
  },
  {
    id: 'security',
    title: 'Segurança da Conta',
    description: 'Defina sua senha',
    fields: ['password', 'confirmPassword'],
    customValidation: (values) => {
      return values.password === values.confirmPassword;
    },
  },
  {
    id: 'organization',
    title: 'Dados da Organização',
    description: 'Sobre seu negócio',
    fields: ['organizationName', 'organizationType', 'organizationSize', 'website'],
  },
  {
    id: 'subscription',
    title: 'Plano & Preferências',
    description: 'Configure sua conta',
    fields: ['subscriptionTier', 'businessHours', 'specialties', 'marketingOptIn'],
    isOptional: true,
  },
];

const signupValidationRules = {
  fullName: validationRules.required('Nome completo é obrigatório'),
  email: {
    ...validationRules.required('Email é obrigatório'),
    ...validationRules.email(),
  },
  phone: validationRules.phone('Telefone inválido'),
  password: {
    ...validationRules.required('Senha é obrigatória'),
    ...validationRules.minLength(8, 'Senha deve ter pelo menos 8 caracteres'),
    custom: (value: string) => {
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[@$!%*?&]/.test(value);

      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return 'Senha deve conter: maiúscula, minúscula, número e símbolo';
      }
      return null;
    },
  },
  confirmPassword: {
    ...validationRules.required('Confirmação de senha é obrigatória'),
    custom: (value: string, values: SignupFormData) => {
      return value === values.password ? null : 'Senhas não coincidem';
    },
  },
  organizationName: {
    ...validationRules.required('Nome da organização é obrigatório'),
    ...validationRules.minLength(2, 'Nome deve ter pelo menos 2 caracteres'),
  },
};

export function EnhancedSignupForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useMultiStepForm({
    steps: formSteps,
    initialValues,
    validationRules: signupValidationRules,
    autoSave: true,
    autoSaveKey: 'signup-form-autosave',
    onSubmit: handleSubmit,
  });

  async function handleSubmit(values: SignupFormData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          organizationName: values.organizationName,
          subscriptionTier: values.subscriptionTier,
          phone: values.phone,
          organizationType: values.organizationType,
          organizationSize: values.organizationSize,
          website: values.website,
          businessHours: values.businessHours,
          specialties: values.specialties,
          marketingOptIn: values.marketingOptIn,
        }),
      });

      const data: SignupResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      if (data.success && data.data) {
        // Store tokens
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        toast({
          title: 'Conta criada com sucesso! 🎉',
          description: `Bem-vindo(a) à ${data.data.user.organization.name}!`,
        });

        if (data.data.needsEmailVerification) {
          toast({
            title: 'Verificação de email',
            description: 'Por favor, verifique seu email para ativar sua conta.',
            variant: 'default',
          });
        }

        // Clear autosave and redirect
        form.clearAutoSave();
        setTimeout(() => {
          navigate('/');
        }, 1500);

        return true;
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Erro ao criar conta',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    }
  }

  const renderStep = () => {
    switch (form.currentStep.id) {
      case 'personal':
        return (
          <StepContent>
            <FieldGroup
              title="Informações Pessoais"
              description="Precisamos de alguns dados básicos para criar sua conta"
            >
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  id="fullName"
                  label="Nome Completo"
                  placeholder="Seu nome completo"
                  required
                  icon={<User className="h-4 w-4" />}
                  value={form.values.fullName}
                  onChange={(value) => form.setValue('fullName', value)}
                  onBlur={() => form.setFieldTouched('fullName')}
                  error={form.getFieldError('fullName')}
                  autoComplete="name"
                />

                <InputField
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  icon={<Mail className="h-4 w-4" />}
                  value={form.values.email}
                  onChange={(value) => form.setValue('email', value)}
                  onBlur={() => form.setFieldTouched('email')}
                  error={form.getFieldError('email')}
                  autoComplete="email"
                />

                <InputField
                  id="phone"
                  label="Telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  description="Opcional - para contato e notificações"
                  value={form.values.phone || ''}
                  onChange={(value) => form.setValue('phone', value)}
                  onBlur={() => form.setFieldTouched('phone')}
                  error={form.getFieldError('phone')}
                  autoComplete="tel"
                />
              </div>
            </FieldGroup>
          </StepContent>
        );

      case 'security':
        return (
          <StepContent>
            <FieldGroup
              title="Configuração de Segurança"
              description="Crie uma senha forte para proteger sua conta"
            >
              <div className="grid grid-cols-1 gap-4">
                <PasswordField
                  id="password"
                  label="Senha"
                  placeholder="Mínimo 8 caracteres"
                  required
                  showStrength
                  value={form.values.password}
                  onChange={(value) => form.setValue('password', value)}
                  onBlur={() => form.setFieldTouched('password')}
                  error={form.getFieldError('password')}
                  autoComplete="new-password"
                />

                <PasswordField
                  id="confirmPassword"
                  label="Confirmar Senha"
                  placeholder="Digite a senha novamente"
                  required
                  value={form.values.confirmPassword}
                  onChange={(value) => form.setValue('confirmPassword', value)}
                  onBlur={() => form.setFieldTouched('confirmPassword')}
                  error={form.getFieldError('confirmPassword')}
                  autoComplete="new-password"
                />
              </div>
            </FieldGroup>
          </StepContent>
        );

      case 'organization':
        return (
          <StepContent>
            <FieldGroup
              title="Dados da Organização"
              description="Conte-nos sobre seu negócio para personalizar sua experiência"
            >
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  id="organizationName"
                  label="Nome da Organização"
                  placeholder="Nome da sua empresa/clínica"
                  required
                  icon={<Building className="h-4 w-4" />}
                  value={form.values.organizationName}
                  onChange={(value) => form.setValue('organizationName', value)}
                  onBlur={() => form.setFieldTouched('organizationName')}
                  error={form.getFieldError('organizationName')}
                  autoComplete="organization"
                />

                <SelectField
                  id="organizationType"
                  label="Tipo de Negócio"
                  placeholder="Selecione o tipo"
                  value={form.values.organizationType}
                  onChange={(value) => form.setValue('organizationType', value)}
                  onBlur={() => form.setFieldTouched('organizationType')}
                  options={[
                    { value: 'veterinary', label: 'Clínica Veterinária' },
                    { value: 'pet_shop', label: 'Pet Shop' },
                    { value: 'grooming', label: 'Pet Grooming' },
                    { value: 'daycare', label: 'Creche/Hotel' },
                    { value: 'other', label: 'Outro' },
                  ]}
                />

                <SelectField
                  id="organizationSize"
                  label="Tamanho da Empresa"
                  placeholder="Selecione o tamanho"
                  value={form.values.organizationSize}
                  onChange={(value) => form.setValue('organizationSize', value)}
                  onBlur={() => form.setFieldTouched('organizationSize')}
                  options={[
                    { value: '1-5', label: '1-5 funcionários' },
                    { value: '6-20', label: '6-20 funcionários' },
                    { value: '21-50', label: '21-50 funcionários' },
                    { value: '51-100', label: '51-100 funcionários' },
                    { value: '100+', label: 'Mais de 100 funcionários' },
                  ]}
                />

                <InputField
                  id="website"
                  label="Website"
                  type="url"
                  placeholder="https://www.suaempresa.com"
                  description="Opcional - link para o site da sua empresa"
                  value={form.values.website || ''}
                  onChange={(value) => form.setValue('website', value)}
                  onBlur={() => form.setFieldTouched('website')}
                  error={form.getFieldError('website')}
                  autoComplete="url"
                />
              </div>
            </FieldGroup>
          </StepContent>
        );

      case 'subscription':
        return (
          <StepContent>
            <FieldGroup
              title="Escolha seu Plano"
              description="Configure sua assinatura e preferências"
            >
              <div className="grid grid-cols-1 gap-6">
                {/* Subscription Plans */}
                <div className="space-y-4">
                  <Label>Plano de Assinatura</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        value: 'free',
                        title: 'Gratuito',
                        description: 'Ideal para começar',
                        features: ['5 clientes', 'Suporte básico', 'Recursos essenciais'],
                        price: 'R$ 0',
                      },
                      {
                        value: 'pro',
                        title: 'Pro',
                        description: 'Para negócios em crescimento',
                        features: ['Clientes ilimitados', 'IA avançada', 'Suporte prioritário'],
                        price: 'R$ 97',
                      },
                      {
                        value: 'enterprise',
                        title: 'Enterprise',
                        description: 'Solução completa',
                        features: ['Recursos completos', 'API personalizada', 'Suporte dedicado'],
                        price: 'R$ 297',
                      },
                    ].map((plan) => (
                      <Card
                        key={plan.value}
                        className={`cursor-pointer transition-all ${
                          form.values.subscriptionTier === plan.value
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => form.setValue('subscriptionTier', plan.value)}
                      >
                        <CardHeader className="text-center">
                          <CardTitle className="flex items-center justify-between">
                            {plan.title}
                            {form.values.subscriptionTier === plan.value && (
                              <Check className="h-5 w-5 text-blue-600" />
                            )}
                          </CardTitle>
                          <div className="text-2xl font-bold text-blue-600">{plan.price}</div>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Additional Preferences */}
                <div className="space-y-4">
                  <TextareaField
                    id="businessHours"
                    label="Horário de Funcionamento"
                    placeholder="Ex: Segunda a Sexta: 8h às 18h, Sábado: 8h às 12h"
                    description="Opcional - ajuda a personalizar notificações"
                    value={form.values.businessHours || ''}
                    onChange={(value) => form.setValue('businessHours', value)}
                    onBlur={() => form.setFieldTouched('businessHours')}
                    rows={2}
                    maxLength={200}
                  />

                  <CheckboxField
                    id="marketingOptIn"
                    checked={form.values.marketingOptIn}
                    onChange={(checked) => form.setValue('marketingOptIn', checked)}
                  >
                    Aceito receber novidades e dicas por email
                  </CheckboxField>
                </div>
              </div>
            </FieldGroup>
          </StepContent>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta no Auzap</h1>
          <p className="text-gray-600 mt-2">
            Configure sua organização em poucos passos simples
          </p>
        </div>

        <MultiStepForm
          currentStep={form.currentStepIndex}
          totalSteps={form.totalSteps}
          steps={form.steps}
          progress={form.getProgress()}
          isFirstStep={form.isFirstStep}
          isLastStep={form.isLastStep}
          canProceed={form.canProceed}
          isSubmitting={form.isSubmitting}
          getStepStatus={form.getStepStatus}
          onNext={form.nextStep}
          onPrevious={form.previousStep}
          onGoToStep={form.goToStep}
          onSubmit={form.submitForm}
          className="bg-white rounded-lg shadow-xl p-6"
        >
          {renderStep()}
        </MultiStepForm>

        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => navigate('/')}
            disabled={form.isSubmitting}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Já tem uma conta? Fazer login
          </Button>
        </div>
      </div>
    </div>
  );
}