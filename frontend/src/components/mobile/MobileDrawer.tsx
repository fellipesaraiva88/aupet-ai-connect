import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  MessageCircle,
  Users,
  Heart,
  Calendar,
  ShoppingBag,
  Brain,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Bell,
  Star,
  Gift,
  Shield,
  Coffee,
  X
} from 'lucide-react';

interface DrawerMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number | string;
  badgeVariant?: 'default' | 'destructive' | 'secondary' | 'outline';
  section: 'main' | 'secondary' | 'account';
}

const menuItems: DrawerMenuItem[] = [
  // Main Navigation
  {
    id: 'dashboard',
    label: 'Central do Amor',
    icon: Home,
    path: '/',
    section: 'main'
  },
  {
    id: 'conversations',
    label: 'Conversas Especiais',
    icon: MessageCircle,
    path: '/conversations',
    badge: 5,
    badgeVariant: 'destructive',
    section: 'main'
  },
  {
    id: 'clients-pets',
    label: 'Famílias & Pets',
    icon: Heart,
    path: '/clients-pets',
    badge: 'Nova',
    badgeVariant: 'secondary',
    section: 'main'
  },
  {
    id: 'appointments',
    label: 'Cuidados Agendados',
    icon: Calendar,
    path: '/appointments',
    badge: 3,
    section: 'main'
  },

  // Secondary Features
  {
    id: 'catalog',
    label: 'Lojinha Pet Care',
    icon: ShoppingBag,
    path: '/catalog',
    section: 'secondary'
  },
  {
    id: 'ai-config',
    label: 'Assistente Inteligente',
    icon: Brain,
    path: '/ai-config',
    section: 'secondary'
  },
  {
    id: 'analytics',
    label: 'Insights do Coração',
    icon: TrendingUp,
    path: '/analytics',
    section: 'secondary'
  },

  // Account & Settings
  {
    id: 'profile',
    label: 'Meu Perfil',
    icon: User,
    path: '/profile',
    section: 'account'
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: Bell,
    path: '/notifications',
    badge: 2,
    section: 'account'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    path: '/settings',
    section: 'account'
  }
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleMenuClick = (path: string) => {
    navigate(path);
    onClose();

    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    return path !== '/' && location.pathname.startsWith(path);
  };

  const renderMenuSection = (section: 'main' | 'secondary' | 'account') => {
    const sectionItems = menuItems.filter(item => item.section === section);

    return sectionItems.map((item) => {
      const IconComponent = item.icon;
      const active = isActive(item.path);

      return (
        <motion.div
          key={item.id}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant={active ? 'secondary' : 'ghost'}
            onClick={() => handleMenuClick(item.path)}
            className={cn(
              'w-full justify-start h-12 text-left group',
              'transition-all duration-200',
              active && 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
            )}
          >
            <IconComponent
              className={cn(
                'mr-3 h-5 w-5 transition-colors',
                active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
              )}
            />
            <span className="flex-1 font-medium">{item.label}</span>

            {item.badge && (
              <Badge
                variant={item.badgeVariant || 'default'}
                className={cn(
                  'ml-2 h-5',
                  typeof item.badge === 'number' && item.badge < 10 && 'min-w-[20px] px-1'
                )}
              >
                {item.badge}
              </Badge>
            )}
          </Button>
        </motion.div>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 300,
            mass: 0.8
          }}
          className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-white shadow-xl"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
            paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
            paddingRight: '1rem'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🐾</span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">Auzap.ai</h2>
                <p className="text-xs text-gray-500">Pet Care Intelligence</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile Section */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>

                  <div className="flex items-center mt-1">
                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                    <span className="text-xs text-gray-500">Pet Care Pro</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scrollable Menu Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {/* Main Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1"
              >
                {renderMenuSection('main')}
              </motion.div>

              <Separator className="my-4" />

              {/* Secondary Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1"
              >
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Recursos Avançados
                </p>
                {renderMenuSection('secondary')}
              </motion.div>

              <Separator className="my-4" />

              {/* Account & Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-1"
              >
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Conta & Configurações
                </p>
                {renderMenuSection('account')}
              </motion.div>

              <Separator className="my-4" />

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-1"
              >
                <Button
                  variant="ghost"
                  onClick={() => handleMenuClick('/help')}
                  className="w-full justify-start h-12 text-left"
                >
                  <HelpCircle className="mr-3 h-5 w-5 text-gray-500" />
                  <span className="font-medium">Ajuda & Suporte</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start h-12 text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="font-medium">Sair da Conta</span>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 pt-4 border-t border-gray-200"
          >
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span>v1.0.0</span>
              <span>•</span>
              <span className="flex items-center">
                Feito com <Heart className="h-3 w-3 mx-1 text-red-500" /> para pets
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for drawer utilities
export function useMobileDrawer() {
  const location = useLocation();

  const shouldShowDrawer = () => {
    const hiddenPaths = ['/login', '/signup'];
    return !hiddenPaths.some(path => location.pathname.startsWith(path));
  };

  return {
    shouldShow: shouldShowDrawer()
  };
}