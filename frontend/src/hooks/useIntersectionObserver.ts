import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  skip?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: React.RefCallback<Element>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver({
  threshold = 0,
  rootMargin = '0px',
  triggerOnce = false,
  skip = false,
  ...options
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<Element | null>(null);

  const ref = useCallback((element: Element | null) => {
    elementRef.current = element;
  }, []);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || skip || (triggerOnce && hasTriggered)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && triggerOnce) {
          setHasTriggered(true);
        }
      },
      {
        threshold,
        rootMargin,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered, skip, options]);

  return {
    ref,
    isIntersecting,
    entry,
  };
}

// Hook for lazy loading images
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const { ref, isIntersecting } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();

      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };

      img.onerror = () => {
        setIsError(true);
      };

      img.src = src;
    }
  }, [isIntersecting, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isIntersecting,
  };
}

// Hook for infinite scrolling
interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    skip: !hasMore || isLoading,
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore]);

  return { ref };
}

// Hook for element visibility tracking
export function useVisibilityTracker(
  onVisible?: () => void,
  onHidden?: () => void,
  options?: UseIntersectionObserverOptions
) {
  const { ref, isIntersecting, entry } = useIntersectionObserver({
    threshold: 0.5,
    ...options,
  });

  const wasVisible = useRef(false);

  useEffect(() => {
    if (isIntersecting && !wasVisible.current) {
      wasVisible.current = true;
      onVisible?.();
    } else if (!isIntersecting && wasVisible.current) {
      wasVisible.current = false;
      onHidden?.();
    }
  }, [isIntersecting, onVisible, onHidden]);

  return {
    ref,
    isVisible: isIntersecting,
    visibilityRatio: entry?.intersectionRatio || 0,
    entry,
  };
}

// Hook for scroll-based animations
interface UseScrollAnimationOptions extends UseIntersectionObserverOptions {
  animationClass?: string;
  duration?: number;
}

export function useScrollAnimation({
  animationClass = 'animate-in',
  duration = 500,
  ...observerOptions
}: UseScrollAnimationOptions = {}) {
  const [isAnimated, setIsAnimated] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const { ref, isIntersecting } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.1,
    ...observerOptions,
  });

  const setRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
    ref(element);
  }, [ref]);

  useEffect(() => {
    if (isIntersecting && elementRef.current && !isAnimated) {
      const element = elementRef.current;
      element.classList.add(animationClass);
      setIsAnimated(true);

      // Remove animation class after duration to allow re-animation if needed
      const timeout = setTimeout(() => {
        element.classList.remove(animationClass);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isIntersecting, animationClass, duration, isAnimated]);

  return {
    ref: setRef,
    isInView: isIntersecting,
    isAnimated,
  };
}