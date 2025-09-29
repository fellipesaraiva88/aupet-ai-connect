import { useState, useEffect, useCallback } from 'react';

export type Orientation = 'portrait' | 'landscape' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';

interface OrientationState {
  orientation: Orientation;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isLocked: boolean;
}

interface OrientationOptions {
  enableLocking?: boolean;
  watchDeviceOrientation?: boolean;
  debounceMs?: number;
}

export function useMobileOrientation(options: OrientationOptions = {}) {
  const {
    enableLocking = true,
    watchDeviceOrientation = true,
    debounceMs = 100
  } = options;

  const [orientationState, setOrientationState] = useState<OrientationState>(() => {
    const initialOrientation = getOrientationFromWindow();
    return {
      orientation: initialOrientation,
      angle: getOrientationAngle(),
      isPortrait: initialOrientation.includes('portrait'),
      isLandscape: initialOrientation.includes('landscape'),
      isLocked: false
    };
  });

  // Get orientation from window dimensions and screen orientation
  function getOrientationFromWindow(): Orientation {
    if (typeof window === 'undefined') return 'portrait';

    // Try to get orientation from Screen Orientation API
    if (screen.orientation) {
      return screen.orientation.type as Orientation;
    }

    // Fallback to window dimensions
    const { innerWidth, innerHeight } = window;
    if (innerHeight > innerWidth) {
      return 'portrait';
    } else {
      return 'landscape';
    }
  }

  // Get orientation angle
  function getOrientationAngle(): number {
    if (typeof window === 'undefined') return 0;

    if (screen.orientation) {
      return screen.orientation.angle;
    }

    // Fallback to deprecated window.orientation
    return (window as any).orientation || 0;
  }

  // Update orientation state
  const updateOrientation = useCallback(() => {
    const orientation = getOrientationFromWindow();
    const angle = getOrientationAngle();

    setOrientationState(prev => ({
      ...prev,
      orientation,
      angle,
      isPortrait: orientation.includes('portrait'),
      isLandscape: orientation.includes('landscape')
    }));
  }, []);

  // Debounced orientation update
  const debouncedUpdate = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateOrientation, debounceMs);
    };
  }, [updateOrientation, debounceMs]);

  // Lock orientation to specific type
  const lockOrientation = useCallback(async (orientation: OrientationLockType): Promise<boolean> => {
    if (!enableLocking || !screen.orientation?.lock) {
      console.warn('Orientation locking is not supported or disabled');
      return false;
    }

    try {
      await screen.orientation.lock(orientation);
      setOrientationState(prev => ({ ...prev, isLocked: true }));
      return true;
    } catch (error) {
      console.error('Failed to lock orientation:', error);
      return false;
    }
  }, [enableLocking]);

  // Unlock orientation
  const unlockOrientation = useCallback(() => {
    if (!enableLocking || !screen.orientation?.unlock) {
      console.warn('Orientation unlocking is not supported or disabled');
      return false;
    }

    try {
      screen.orientation.unlock();
      setOrientationState(prev => ({ ...prev, isLocked: false }));
      return true;
    } catch (error) {
      console.error('Failed to unlock orientation:', error);
      return false;
    }
  }, [enableLocking]);

  // Lock to portrait
  const lockToPortrait = useCallback(() => {
    return lockOrientation('portrait');
  }, [lockOrientation]);

  // Lock to landscape
  const lockToLandscape = useCallback(() => {
    return lockOrientation('landscape');
  }, [lockOrientation]);

  // Auto-rotate based on content
  const autoRotateForContent = useCallback((contentType: 'video' | 'image' | 'text') => {
    switch (contentType) {
      case 'video':
        return lockToLandscape();
      case 'image':
        // Keep current orientation for images
        return Promise.resolve(true);
      case 'text':
        return lockToPortrait();
      default:
        return Promise.resolve(false);
    }
  }, [lockToPortrait, lockToLandscape]);

  // Setup event listeners
  useEffect(() => {
    if (!watchDeviceOrientation) return;

    const debounced = debouncedUpdate();

    // Use Screen Orientation API if available
    if (screen.orientation) {
      screen.orientation.addEventListener('change', debounced);

      return () => {
        screen.orientation.removeEventListener('change', debounced);
      };
    }

    // Fallback to orientationchange and resize events
    const handleOrientationChange = debounced;
    const handleResize = debounced;

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [watchDeviceOrientation, debouncedUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (orientationState.isLocked) {
        unlockOrientation();
      }
    };
  }, [orientationState.isLocked, unlockOrientation]);

  return {
    ...orientationState,
    lockOrientation,
    unlockOrientation,
    lockToPortrait,
    lockToLandscape,
    autoRotateForContent,
    isSupported: typeof screen !== 'undefined' && 'orientation' in screen
  };
}

// Hook for orientation-aware CSS classes
export function useOrientationClasses() {
  const { orientation, isPortrait, isLandscape } = useMobileOrientation();

  const classes = {
    orientation: `orientation-${orientation}`,
    base: isPortrait ? 'portrait' : 'landscape',
    responsive: {
      'portrait': isPortrait,
      'landscape': isLandscape,
      'portrait-primary': orientation === 'portrait-primary',
      'portrait-secondary': orientation === 'portrait-secondary',
      'landscape-primary': orientation === 'landscape-primary',
      'landscape-secondary': orientation === 'landscape-secondary'
    }
  };

  return classes;
}

// Hook for orientation-specific layouts
export function useOrientationLayout() {
  const { isPortrait, isLandscape, orientation } = useMobileOrientation();

  const getLayoutConfig = useCallback(() => {
    if (isPortrait) {
      return {
        direction: 'column' as const,
        itemsPerRow: 1,
        aspectRatio: '3/4',
        padding: '1rem',
        gap: '0.75rem'
      };
    } else {
      return {
        direction: 'row' as const,
        itemsPerRow: 2,
        aspectRatio: '16/9',
        padding: '0.5rem',
        gap: '1rem'
      };
    }
  }, [isPortrait]);

  const getGridConfig = useCallback(() => {
    if (isPortrait) {
      return {
        columns: 2,
        rows: 'auto',
        gap: '1rem',
        template: 'repeat(2, 1fr)'
      };
    } else {
      return {
        columns: 3,
        rows: 'auto',
        gap: '1.5rem',
        template: 'repeat(3, 1fr)'
      };
    }
  }, [isPortrait]);

  return {
    orientation,
    isPortrait,
    isLandscape,
    layout: getLayoutConfig(),
    grid: getGridConfig()
  };
}

// Hook for media controls orientation
export function useMediaOrientation() {
  const { lockToLandscape, lockToPortrait, unlockOrientation, isLandscape } = useMobileOrientation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreenLandscape = useCallback(async () => {
    try {
      // Request fullscreen first
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }

      // Then lock orientation
      await lockToLandscape();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen landscape:', error);
    }
  }, [lockToLandscape]);

  const exitFullscreenPortrait = useCallback(async () => {
    try {
      // Exit fullscreen first
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }

      // Then unlock orientation
      unlockOrientation();
      await lockToPortrait();
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, [unlockOrientation, lockToPortrait]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (!isNowFullscreen) {
        // Auto unlock when exiting fullscreen
        unlockOrientation();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [unlockOrientation]);

  return {
    isFullscreen,
    isLandscape,
    enterFullscreenLandscape,
    exitFullscreenPortrait,
    canFullscreen: 'requestFullscreen' in document.documentElement
  };
}