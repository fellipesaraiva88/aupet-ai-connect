import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  MessageCircle,
  Heart,
  Calendar,
  Menu,
  Bell
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  color: string;
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
    color: 'text-blue-500'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    path: '/conversations',
    badge: 3,
    color: 'text-green-500'
  },
  {
    id: 'pets',
    label: 'Pets',
    icon: Heart,
    path: '/clients-pets',
    color: 'text-pink-500'
  },
  {
    id: 'calendar',
    label: 'Agenda',
    icon: Calendar,
    path: '/appointments',
    badge: 2,
    color: 'text-purple-500'
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: Menu,
    path: '/menu',
    color: 'text-gray-500'
  }
];

export function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const currentPath = location.pathname;
    return tabs.find(tab => {
      if (tab.path === '/' && currentPath === '/') return true;
      if (tab.path !== '/' && currentPath.startsWith(tab.path)) return true;
      return false;
    })?.id || 'home';
  };

  const activeTab = getActiveTab();

  const handleTabPress = (tab: TabItem) => {
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    navigate(tab.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* Tab Bar Background with Blur */}
      <div className="bg-white/90 backdrop-blur-lg border-t border-gray-200/50 shadow-lg">
        <div
          className="flex items-center justify-around px-2 py-2"
          style={{
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))'
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabPress(tab)}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'px-3 py-2 rounded-xl transition-all duration-200',
                  'min-w-[64px] min-h-[56px]',
                  'active:scale-95 active:bg-gray-100',
                  isActive && 'bg-gray-50'
                )}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                {/* Icon Container */}
                <div className="relative mb-1">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      rotateY: isActive ? [0, 10, 0] : 0
                    }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeOut'
                    }}
                  >
                    <IconComponent
                      className={cn(
                        'h-5 w-5 transition-colors duration-200',
                        isActive ? tab.color : 'text-gray-400'
                      )}
                    />
                  </motion.div>

                  {/* Badge */}
                  <AnimatePresence>
                    {tab.badge && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-2 -right-2"
                      >
                        <Badge
                          variant="destructive"
                          className="h-4 w-4 p-0 flex items-center justify-center text-xs"
                        >
                          {tab.badge > 9 ? '9+' : tab.badge}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <motion.span
                  className={cn(
                    'text-xs font-medium transition-colors duration-200',
                    isActive ? tab.color : 'text-gray-400'
                  )}
                  animate={{
                    opacity: isActive ? 1 : 0.7,
                    y: isActive ? 0 : 1
                  }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeOut'
                  }}
                >
                  {tab.label}
                </motion.span>

                {/* Active Indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={cn(
                        'absolute -bottom-0.5 w-1 h-1 rounded-full',
                        tab.color.replace('text-', 'bg-')
                      )}
                    />
                  )}
                </AnimatePresence>

                {/* Ripple Effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-current opacity-0"
                  whileTap={{ opacity: 0.1 }}
                  transition={{ duration: 0.15 }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Pet Care Themed Bottom Accent */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 via-pink-500 to-purple-500 rounded-t-full opacity-60" />
    </div>
  );
}

// Hook for tab bar utilities
export function useMobileTabBar() {
  const location = useLocation();

  const isTabBarVisible = () => {
    const hiddenPaths = ['/login', '/signup', '/onboarding'];
    return !hiddenPaths.some(path => location.pathname.startsWith(path));
  };

  const getCurrentTab = () => {
    return tabs.find(tab => {
      if (tab.path === '/' && location.pathname === '/') return true;
      if (tab.path !== '/' && location.pathname.startsWith(tab.path)) return true;
      return false;
    }) || tabs[0];
  };

  return {
    isVisible: isTabBarVisible(),
    currentTab: getCurrentTab(),
    tabs
  };
}

// Tab bar height constant for layout calculations
export const MOBILE_TAB_BAR_HEIGHT = 80; // px