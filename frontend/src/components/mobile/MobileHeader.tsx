import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Menu,
  Bell,
  Search,
  ArrowLeft,
  MoreHorizontal,
  Heart,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  showBack?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  subtitle,
  onMenuClick,
  onBackClick,
  showBack = false,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  actions,
  className
}: MobileHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get page title based on route
  const getPageTitle = () => {
    if (title) return title;

    const path = location.pathname;
    const pageTitles: Record<string, string> = {
      '/': 'Central do Amor 💖',
      '/conversations': 'Conversas Especiais 💬',
      '/clients-pets': 'Famílias & Pets 🐾',
      '/appointments': 'Cuidados Agendados 📅',
      '/catalog': 'Lojinha Pet Care 🛍️',
      '/analytics': 'Insights do Coração 📊',
      '/ai-config': 'Assistente Inteligente 🧠',
      '/settings': 'Configurações ⚙️'
    };

    return pageTitles[path] || 'Auzap.ai';
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Implement global search logic here
      console.log('Searching for:', query);
    }
  };

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'bg-white/95 backdrop-blur-md',
        'border-b border-gray-200/50',
        'shadow-sm',
        className
      )}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      <div className="px-4 pb-3">
        <AnimatePresence mode="wait">
          {!isSearchOpen ? (
            <motion.div
              key="header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between h-12"
            >
              {/* Left Side */}
              <div className="flex items-center space-x-3">
                {showBack ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMenuClick}
                    className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}

                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                    {getPageTitle()}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-gray-500 leading-none">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-2">
                {showSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchOpen(true)}
                    className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}

                {showNotifications && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full hover:bg-gray-100 relative"
                  >
                    <Bell className="h-5 w-5" />
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      3
                    </Badge>
                  </Button>
                )}

                {actions}

                {showProfile && user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/settings')}
                    className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-3 h-12"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="h-10 w-10 p-0 rounded-full hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex-1 relative">
                <Input
                  placeholder="Buscar clientes, pets, mensagens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery);
                      setIsSearchOpen(false);
                    }
                  }}
                  className="pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                  autoFocus
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleSearch(searchQuery);
                    setIsSearchOpen(false);
                  }}
                  className="text-blue-600 font-medium px-3"
                >
                  Buscar
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar for Loading States */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut'
            }}
            style={{ width: '30%' }}
          />
        </div>
      </div>
    </header>
  );
}

// Quick Action Buttons Component
export function MobileHeaderActions({
  onFavoriteClick,
  onShareClick,
  onMoreClick,
  showFavorite = true,
  showShare = true,
  showMore = true
}: {
  onFavoriteClick?: () => void;
  onShareClick?: () => void;
  onMoreClick?: () => void;
  showFavorite?: boolean;
  showShare?: boolean;
  showMore?: boolean;
}) {
  return (
    <div className="flex items-center space-x-1">
      {showFavorite && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onFavoriteClick}
          className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
        >
          <Heart className="h-5 w-5" />
        </Button>
      )}

      {showShare && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onShareClick}
          className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
        >
          <Search className="h-5 w-5" />
        </Button>
      )}

      {showMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoreClick}
          className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

// Header height constant for layout calculations
export const MOBILE_HEADER_HEIGHT = 64; // px