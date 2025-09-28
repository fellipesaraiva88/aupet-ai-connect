import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Building, Mail, Lock, Eye, EyeOff, Heart, Sparkles } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://auzap-backend.onrender.com';

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
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

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
    subscriptionTier: 'free'
  });

  const [errors, setErrors] = useState<Partial<SignupData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupData> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Senha deve conter: maiúscula, minúscula, número e símbolo';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Nome completo é obrigatório';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.organizationName) {
      newErrors.organizationName = 'Nome da organização é obrigatório';
    } else if (formData.organizationName.length < 2) {
      newErrors.organizationName = 'Nome da organização deve ter pelo menos 2 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os erros no formulário',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: SignupResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      if (data.success && data.data) {
        // Armazenar tokens no localStorage
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

        // Redirecionar para o dashboard
        setTimeout(() => {
          navigate('/');
        }, 1500);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const subscriptionOptions = [
    { value: 'free', label: 'Plano Gratuito - Básico para começar' },
    { value: 'pro', label: 'Plano Pro - Recursos avançados' },
    { value: 'enterprise', label: 'Plano Enterprise - Solução completa' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced pet-themed background */}
      <div className="absolute inset-0 paw-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-400/20 rounded-full glass-morphism animate-glass-float" />
      <div className="absolute bottom-20 right-20 w-16 h-16 bg-gradient-to-br from-pink-400/20 to-accent/20 rounded-full glass-morphism animate-pet-bounce delay-1000" />
      <div className="absolute top-1/3 right-10 w-12 h-12 bg-gradient-to-br from-secondary/20 to-blue-400/20 rounded-full glass-morphism animate-glass-float delay-500" />

      <Card className="w-full max-w-lg shadow-2xl glass-morphism bg-gradient-card border-0 relative">
        {/* Magical pet particles */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-primary to-purple-600 rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-pink-500 to-red-500 rounded-full animate-pulse delay-300" />

        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl shadow-xl pet-glow">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-red-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Criar Conta
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Crie sua organização e comece a cuidar dos pets com amor digital
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Nome Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.fullName && (
                <p className="text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Nome da Organização */}
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700">
                Nome da Organização
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Nome da sua empresa/clínica"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  className={`pl-10 ${errors.organizationName ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.organizationName && (
                <p className="text-sm text-red-600">{errors.organizationName}</p>
              )}
            </div>

            {/* Plano de Assinatura */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Plano de Assinatura
              </Label>
              <Select
                value={formData.subscriptionTier}
                onValueChange={(value: 'free' | 'pro' | 'enterprise') =>
                  handleInputChange('subscriptionTier', value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando sua conta com carinho...
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Criar Conta
                  <Heart className="h-5 w-5" />
                </div>
              )}
            </Button>

            {/* Link para Login */}
            <div className="text-center text-sm text-gray-600">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 font-medium"
                disabled={isLoading}
              >
                Fazer login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;