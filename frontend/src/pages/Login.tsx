import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, verifique os campos abaixo.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        console.error('Login error:', error);
        toast({
          title: 'Erro ao fazer login',
          description: 'Email ou senha incorretos.',
          variant: 'destructive'
        });
        return;
      }

      if (data?.user) {
        // Fetch user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        // Debug logs
        console.log('🔐 User ID:', data.user.id);
        console.log('👤 Profile data:', profile);
        console.log('❌ Profile error:', profileError);
        console.log('🎯 Role detected:', profile?.role);

        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao Auzap.',
        });

        // Redirect based on role
        const redirectPath = profile?.role === 'super_admin' ? '/admin' : '/';
        console.log('🚀 Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Quick login for development
  const handleQuickLogin = async () => {
    const devCredentials = {
      email: 'admin@auzap.com',
      password: 'auzap123'
    };

    setFormData(devCredentials);
    setIsLoading(true);

    try {
      // Try actual login first
      const { data, error } = await signIn(devCredentials.email, devCredentials.password);

      if (error) {
        // If login fails, create mock user session for development
        console.log('Login failed, using dev mode bypass...');

        // Mock user data for development
        const mockUser = {
          id: 'dev-user-123',
          email: devCredentials.email,
          name: 'Desenvolvedor',
          role: 'admin'
        };

        // Store in localStorage for development
        localStorage.setItem('auzap_dev_user', JSON.stringify(mockUser));
        localStorage.setItem('auzap_dev_token', 'dev-token-' + Date.now());

        toast({
          title: 'Modo desenvolvedores ativo! 💻💝',
          description: 'Acesso especial liberado com muito carinho',
        });

        // Force navigation to dashboard
        window.location.href = '/';
        return;
      }

      if (data?.user) {
        // Fetch user profile to check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        toast({
          title: 'Bem-vindo de volta! 🎉💝',
          description: 'Que alegria ter você aqui! Vamos espalhar muito amor pelos pets.',
        });

        // Redirect based on role
        if (profile?.role === 'super_admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      console.error('Quick login error:', error);

      // Fallback to dev mode
      const mockUser = {
        id: 'dev-user-123',
        email: devCredentials.email,
        name: 'Desenvolvedor',
        role: 'admin'
      };

      localStorage.setItem('auzap_dev_user', JSON.stringify(mockUser));
      localStorage.setItem('auzap_dev_token', 'dev-token-' + Date.now());

      toast({
        title: 'Modo desenvolvimento especial! 🚀💝',
        description: 'Usando autenticação carinhosa para devs',
      });

      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="space-y-3">
            <CardTitle className="text-4xl font-bold text-blue-600">
              Auzap
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Faça login para acessar sua conta
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••••"
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


            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;