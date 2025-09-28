import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Building, Mail, Lock, Eye, EyeOff, Heart, Sparkles, ArrowRight } from 'lucide-react';

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter: maiúscula, minúscula e número';
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
      // Usar Supabase Auth diretamente - mais simples e confiável
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            organization_name: formData.organizationName,
            subscription_tier: formData.subscriptionTier
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        toast({
          title: 'Conta criada com sucesso! 🎉',
          description: data.user.email_confirmed_at
            ? 'Redirecionando para o dashboard...'
            : 'Verifique seu email para ativar a conta.',
        });

        // Se email já confirmado, redirecionar para dashboard
        if (data.user.email_confirmed_at) {
          navigate('/');
        } else {
          // Aguardar confirmação de email
          toast({
            title: 'Confirmação necessária',
            description: 'Verifique seu email e clique no link de confirmação para ativar sua conta.',
          });
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Erro no cadastro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignupData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Quick fill for development
  const handleQuickFill = () => {
    setFormData({
      email: 'novousuario@empresa.com',
      password: 'MinhaSenh@123',
      fullName: 'Novo Usuário',
      organizationName: 'Minha Empresa Pet',
      subscriptionTier: 'free'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-pink-600/5" />
      <div className="absolute top-16 left-8 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-pink-300/20 blur-xl"></div>
      </div>
      <div className="absolute bottom-16 right-16 animate-pulse delay-1000">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-300/20 to-primary/20 blur-xl"></div>
      </div>

      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/90 backdrop-blur-sm relative">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto p-3 bg-gradient-to-br from-primary to-pink-600 rounded-xl shadow-lg w-fit">
            <Heart className="h-8 w-8 text-white" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Crie sua conta
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Comece a transformar o cuidado pet com inteligência artificial
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.fullName}
                    onChange={handleInputChange('fullName')}
                    className={`pl-10 h-11 ${errors.fullName ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-sm font-medium">Nome da Empresa</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Sua empresa"
                    value={formData.organizationName}
                    onChange={handleInputChange('organizationName')}
                    className={`pl-10 h-11 ${errors.organizationName ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.organizationName && (
                  <p className="text-sm text-destructive">{errors.organizationName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className={`pl-10 h-11 ${errors.email ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className={`pl-10 pr-10 h-11 ${errors.password ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-9 w-9 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionTier" className="text-sm font-medium">Plano</Label>
              <Select
                value={formData.subscriptionTier}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subscriptionTier: value as 'free' | 'pro' | 'enterprise' }))}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito - Até 100 mensagens/mês</SelectItem>
                  <SelectItem value="pro">Pro - Até 1000 mensagens/mês</SelectItem>
                  <SelectItem value="enterprise">Enterprise - Ilimitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 text-white font-medium shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Development Helper */}
          {import.meta.env.DEV && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleQuickFill}
                className="w-full text-sm"
                disabled={isLoading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Preencher Rápido (Dev)
              </Button>
            </div>
          )}

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                onClick={() => navigate('/login')}
              >
                Entrar
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;