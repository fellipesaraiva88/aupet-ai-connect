import { useEffect, useRef, useCallback, useState } from 'react';

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

interface GestureState {
  isGesturing: boolean;
  gestureType: GestureType | null;
  startPoint: TouchPoint | null;
  currentPoint: TouchPoint | null;
  distance: number;
  velocity: { x: number; y: number };
  direction: SwipeDirection | null;
  scale: number;
  rotation: number;
  duration: number;
}

type GestureType = 'tap' | 'long-press' | 'swipe' | 'pinch' | 'rotate' | 'pan';
type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface GestureCallbacks {
  onTap?: (point: TouchPoint) => void;
  onDoubleTap?: (point: TouchPoint) => void;
  onLongPress?: (point: TouchPoint) => void;
  onSwipe?: (direction: SwipeDirection, distance: number, velocity: { x: number; y: number }) => void;
  onSwipeStart?: (direction: SwipeDirection) => void;
  onSwipeEnd?: (direction: SwipeDirection, distance: number) => void;
  onPinch?: (scale: number, center: TouchPoint) => void;
  onPinchStart?: (initialScale: number) => void;
  onPinchEnd?: (finalScale: number) => void;
  onRotate?: (angle: number, center: TouchPoint) => void;
  onPan?: (delta: { x: number; y: number }, point: TouchPoint) => void;
  onPanStart?: (point: TouchPoint) => void;
  onPanEnd?: (point: TouchPoint, velocity: { x: number; y: number }) => void;
}

interface GestureOptions {
  tapThreshold?: number; // ms
  longPressThreshold?: number; // ms
  swipeThreshold?: number; // px
  swipeVelocityThreshold?: number; // px/ms
  pinchThreshold?: number;
  rotationThreshold?: number; // degrees
  preventDefault?: boolean;
  enableHapticFeedback?: boolean;
}

const DEFAULT_OPTIONS: Required<GestureOptions> = {
  tapThreshold: 200,
  longPressThreshold: 500,
  swipeThreshold: 30,
  swipeVelocityThreshold: 0.5,
  pinchThreshold: 0.1,
  rotationThreshold: 5,
  preventDefault: true,
  enableHapticFeedback: true
};

export function useMobileGestures(
  callbacks: GestureCallbacks,
  options: GestureOptions = {}
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const gestureState = useRef<GestureState>({
    isGesturing: false,
    gestureType: null,
    startPoint: null,
    currentPoint: null,
    distance: 0,
    velocity: { x: 0, y: 0 },
    direction: null,
    scale: 1,
    rotation: 0,
    duration: 0
  });

  const [isGesturing, setIsGesturing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTap = useRef<TouchPoint | null>(null);
  const touches = useRef<Map<number, TouchPoint>>(new Map());

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Haptic feedback utility
  const hapticFeedback = useCallback((pattern: number | number[] = 50) => {
    if (opts.enableHapticFeedback && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [opts.enableHapticFeedback]);

  // Calculate distance between two points
  const calculateDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  // Calculate velocity
  const calculateVelocity = useCallback((p1: TouchPoint, p2: TouchPoint): { x: number; y: number } => {
    const timeDiff = p2.timestamp - p1.timestamp;
    if (timeDiff === 0) return { x: 0, y: 0 };

    return {
      x: (p2.x - p1.x) / timeDiff,
      y: (p2.y - p1.y) / timeDiff
    };
  }, []);

  // Determine swipe direction
  const getSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): SwipeDirection | null => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) < opts.swipeThreshold) return null;

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, [opts.swipeThreshold]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (opts.preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const touchPoint: TouchPoint = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    touches.current.set(touch.identifier, touchPoint);
    gestureState.current.startPoint = touchPoint;
    gestureState.current.currentPoint = touchPoint;
    gestureState.current.isGesturing = true;
    setIsGesturing(true);

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (gestureState.current.isGesturing && gestureState.current.distance < opts.swipeThreshold) {
        gestureState.current.gestureType = 'long-press';
        hapticFeedback([50, 100, 50]);
        callbacks.onLongPress?.(touchPoint);
      }
    }, opts.longPressThreshold);

    // Handle pan start
    callbacks.onPanStart?.(touchPoint);

    // Handle multi-touch gestures
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Store initial pinch/rotation data
      const center: TouchPoint = {
        id: -1,
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        timestamp: Date.now()
      };

      gestureState.current.scale = calculateDistance(
        { id: 0, x: touch1.clientX, y: touch1.clientY, timestamp: Date.now() },
        { id: 0, x: touch2.clientX, y: touch2.clientY, timestamp: Date.now() }
      );

      callbacks.onPinchStart?.(gestureState.current.scale);
    }
  }, [callbacks, opts, hapticFeedback, calculateDistance]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (opts.preventDefault) {
      e.preventDefault();
    }

    if (!gestureState.current.isGesturing || !gestureState.current.startPoint) return;

    const touch = e.touches[0];
    const currentPoint: TouchPoint = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    gestureState.current.currentPoint = currentPoint;
    gestureState.current.distance = calculateDistance(gestureState.current.startPoint, currentPoint);
    gestureState.current.velocity = calculateVelocity(gestureState.current.startPoint, currentPoint);
    gestureState.current.duration = currentPoint.timestamp - gestureState.current.startPoint.timestamp;

    // Clear long press timer if movement detected
    if (gestureState.current.distance > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle pan
    const delta = {
      x: currentPoint.x - gestureState.current.startPoint.x,
      y: currentPoint.y - gestureState.current.startPoint.y
    };
    callbacks.onPan?.(delta, currentPoint);

    // Handle swipe
    if (gestureState.current.distance > opts.swipeThreshold) {
      const direction = getSwipeDirection(gestureState.current.startPoint, currentPoint);
      if (direction && gestureState.current.direction !== direction) {
        gestureState.current.direction = direction;
        gestureState.current.gestureType = 'swipe';
        callbacks.onSwipeStart?.(direction);
      }

      if (direction) {
        callbacks.onSwipe?.(direction, gestureState.current.distance, gestureState.current.velocity);
      }
    }

    // Handle pinch/zoom
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = calculateDistance(
        { id: 0, x: touch1.clientX, y: touch1.clientY, timestamp: Date.now() },
        { id: 0, x: touch2.clientX, y: touch2.clientY, timestamp: Date.now() }
      );

      const scale = currentDistance / gestureState.current.scale;

      if (Math.abs(scale - 1) > opts.pinchThreshold) {
        gestureState.current.gestureType = 'pinch';
        const center: TouchPoint = {
          id: -1,
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
          timestamp: Date.now()
        };
        callbacks.onPinch?.(scale, center);
      }
    }
  }, [callbacks, opts, calculateDistance, calculateVelocity, getSwipeDirection]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (opts.preventDefault) {
      e.preventDefault();
    }

    if (!gestureState.current.startPoint || !gestureState.current.currentPoint) return;

    const endTime = Date.now();
    const duration = endTime - gestureState.current.startPoint.timestamp;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle tap
    if (gestureState.current.distance < opts.swipeThreshold && duration < opts.tapThreshold) {
      // Check for double tap
      if (lastTap.current &&
          endTime - lastTap.current.timestamp < 300 &&
          calculateDistance(lastTap.current, gestureState.current.currentPoint) < 50) {
        hapticFeedback([30, 50]);
        callbacks.onDoubleTap?.(gestureState.current.currentPoint);
        lastTap.current = null;
      } else {
        lastTap.current = gestureState.current.currentPoint;
        hapticFeedback(30);
        callbacks.onTap?.(gestureState.current.currentPoint);
      }
    }

    // Handle swipe end
    if (gestureState.current.gestureType === 'swipe' && gestureState.current.direction) {
      callbacks.onSwipeEnd?.(gestureState.current.direction, gestureState.current.distance);
    }

    // Handle pan end
    callbacks.onPanEnd?.(gestureState.current.currentPoint, gestureState.current.velocity);

    // Handle pinch end
    if (gestureState.current.gestureType === 'pinch') {
      callbacks.onPinchEnd?.(gestureState.current.scale);
    }

    // Reset gesture state
    gestureState.current = {
      isGesturing: false,
      gestureType: null,
      startPoint: null,
      currentPoint: null,
      distance: 0,
      velocity: { x: 0, y: 0 },
      direction: null,
      scale: 1,
      rotation: 0,
      duration: 0
    };

    touches.current.clear();
    setIsGesturing(false);
  }, [callbacks, opts, calculateDistance, hapticFeedback]);

  // Setup event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !opts.preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !opts.preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !opts.preventDefault });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: !opts.preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, opts.preventDefault]);

  return {
    elementRef,
    isGesturing,
    gestureType: gestureState.current.gestureType,
    distance: gestureState.current.distance,
    direction: gestureState.current.direction,
    velocity: gestureState.current.velocity,
    scale: gestureState.current.scale
  };
}

// Specialized hook for swipe gestures
export function useSwipeGestures(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  options?: GestureOptions
) {
  return useMobileGestures({
    onSwipe: (direction) => {
      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }
  }, options);
}

// Hook for pull-to-refresh gesture
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options?: { threshold?: number; enabled?: boolean }
) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const opts = {
    threshold: 80,
    enabled: true,
    ...options
  };

  const gestures = useMobileGestures({
    onPanStart: () => {
      if (opts.enabled) {
        setIsPulling(true);
      }
    },
    onPan: (delta) => {
      if (opts.enabled && delta.y > 0) {
        setPullDistance(Math.min(delta.y, opts.threshold * 1.5));
      }
    },
    onPanEnd: async () => {
      if (!opts.enabled) return;

      setIsPulling(false);

      if (pullDistance >= opts.threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
    }
  });

  return {
    ...gestures,
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / opts.threshold, 1)
  };
}