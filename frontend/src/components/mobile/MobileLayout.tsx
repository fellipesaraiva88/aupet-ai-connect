import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { MobileTabBar } from './MobileTabBar';
import { MobileHeader } from './MobileHeader';
import { MobileDrawer } from './MobileDrawer';
import { useBreakpoint } from '../ui/responsive-grid';

interface MobileLayoutProps {
  children: React.ReactNode;
  showTabBar?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  className?: string;
}

export function MobileLayout({
  children,
  showTabBar = true,
  showHeader = true,
  headerTitle,
  className
}: MobileLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });
  const { isMobile } = useBreakpoint();

  // Detect safe area insets for devices with notch/home indicator
  useEffect(() => {
    const updateSafeArea = () => {
      if (typeof window !== 'undefined' && CSS.supports('padding', 'env(safe-area-inset-top)')) {
        const root = document.documentElement;
        const top = parseInt(getComputedStyle(root).getPropertyValue('--safe-area-inset-top') || '0');
        const bottom = parseInt(getComputedStyle(root).getPropertyValue('--safe-area-inset-bottom') || '0');
        const left = parseInt(getComputedStyle(root).getPropertyValue('--safe-area-inset-left') || '0');
        const right = parseInt(getComputedStyle(root).getPropertyValue('--safe-area-inset-right') || '0');

        setSafeAreaInsets({ top, bottom, left, right });
      }
    };

    updateSafeArea();
    window.addEventListener('orientationchange', updateSafeArea);

    return () => window.removeEventListener('orientationchange', updateSafeArea);
  }, []);

  // Add CSS custom properties for safe area
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
    root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
  }, []);

  // If not mobile, return children without mobile layout
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/50',
      'relative overflow-hidden',
      className
    )}
    style={{
      paddingTop: `calc(var(--safe-area-inset-top) + 0px)`,
      paddingBottom: `calc(var(--safe-area-inset-bottom) + 0px)`,
      paddingLeft: `var(--safe-area-inset-left)`,
      paddingRight: `var(--safe-area-inset-right)`
    }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 text-6xl">🐾</div>
        <div className="absolute top-12 right-8 text-4xl">❤️</div>
        <div className="absolute bottom-20 left-8 text-5xl">🐕</div>
        <div className="absolute bottom-32 right-4 text-4xl">🐱</div>
        <div className="absolute top-1/3 right-12 text-3xl">🐾</div>
        <div className="absolute top-2/3 left-12 text-3xl">💖</div>
      </div>

      {/* Mobile Header */}
      {showHeader && (
        <MobileHeader
          title={headerTitle}
          onMenuClick={() => setIsDrawerOpen(true)}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-auto',
          showHeader && 'pt-16',
          showTabBar && 'pb-20'
        )}
        style={{
          height: showHeader && showTabBar
            ? 'calc(100vh - 9rem)'
            : showHeader
              ? 'calc(100vh - 4rem)'
              : showTabBar
                ? 'calc(100vh - 5rem)'
                : '100vh'
        }}
      >
        <div className="px-4 py-2">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar */}
      {showTabBar && <MobileTabBar />}

      {/* Side Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Overlay for drawer */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsDrawerOpen(false)}
          style={{
            paddingTop: 'var(--safe-area-inset-top)',
            paddingBottom: 'var(--safe-area-inset-bottom)'
          }}
        />
      )}
    </div>
  );
}

// Hook for mobile-specific utilities
export function useMobileLayout() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    const handleResize = () => {
      // Detect virtual keyboard on mobile
      if (isMobile) {
        const viewport = window.visualViewport;
        if (viewport) {
          setIsKeyboardOpen(viewport.height < window.innerHeight * 0.75);
        }
      }
    };

    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [isMobile]);

  return {
    orientation,
    isKeyboardOpen,
    isMobile,
    safeAreaSupported: CSS.supports('padding', 'env(safe-area-inset-top)')
  };
}