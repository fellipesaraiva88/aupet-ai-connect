import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Lock, Eye, EyeOff, Heart, Sparkles, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Precisamos do seu email para te encontrar 💌';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Por favor, verifique se o email está correto 😊';
    }

    if (!formData.password) {
      newErrors.password = 'Sua senha especial é necessária 🔐';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Para sua segurança, use pelo menos 6 caracteres 🛡️';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Opa! Vamos ajudar você 🤗',
        description: 'Por favor, verifique as informações abaixo com carinho.',
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
          title: 'Ops! Algo não deu certo 🥺',
          description: 'Verifique suas credenciais com carinho. Estamos aqui para ajudar!',
          variant: 'destructive'
        });
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
      console.error('Login error:', error);
      toast({
        title: 'Ops! Precisamos de um minutinho 🤗',
        description: 'Algo inesperado aconteceu, mas vamos resolver isso juntos!',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-pink-600/5" />
      <div className="absolute top-16 left-8 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-pink-300/20 blur-xl"></div>
      </div>
      <div className="absolute bottom-16 right-16 animate-pulse delay-1000">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-300/20 to-primary/20 blur-xl"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm relative">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto p-3 bg-gradient-to-br from-primary to-pink-600 rounded-xl shadow-lg w-fit">
            <Heart className="h-8 w-8 text-white" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Que alegria ter você de volta! 💝
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Entre na sua conta e continue espalhando amor e cuidado pelos nossos amiguinhos peludos
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
                  placeholder="seu-email-especial@exemplo.com"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm">
                  Lembrar de mim com carinho 💕
                </Label>
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-sm text-primary hover:text-primary/80"
                onClick={() => navigate('/forgot-password')}
              >
                Esqueceu a senha? Não se preocupe! 🤗
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 text-white font-medium shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando com carinho...
                </>
              ) : (
                <>
                  Entrar com Amor 💝
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
                onClick={handleQuickLogin}
                className="w-full text-sm"
                disabled={isLoading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Acesso Carinhoso para Desenvolvedores 💖
              </Button>
            </div>
          )}

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Ainda não faz parte da nossa família?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                onClick={() => navigate('/signup')}
              >
                Junte-se a nós com amor! 🐾💕
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;