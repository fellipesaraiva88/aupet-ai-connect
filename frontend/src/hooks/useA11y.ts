import React, { useEffect, useRef, useState, useCallback } from 'react';

// Focus management hook
export function useFocusManagement() {
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (lastFocusedElement.current && lastFocusedElement.current.focus) {
      lastFocusedElement.current.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { saveFocus, restoreFocus, trapFocus };
}

// Keyboard navigation hook
export function useKeyboardNavigation() {
  const handleArrowNavigation = useCallback((
    event: KeyboardEvent,
    items: NodeListOf<Element> | Element[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    onIndexChange(newIndex);
    (items[newIndex] as HTMLElement)?.focus();
  }, []);

  return { handleArrowNavigation };
}

// Screen reader announcements
export function useScreenReader() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!announceRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
      announceRef.current = announcer;
    }

    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
        announceRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;

      // Clear the message after a brief moment to allow re-announcement
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announce };
}

// Reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// High contrast mode detection
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

// Live region hook for dynamic content
export function useLiveRegion() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  const updateLiveRegion = useCallback((content: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority);
      regionRef.current.textContent = content;
    }
  }, []);

  const createLiveRegion = useCallback((className: string = '') => {
    const div = document.createElement('div');
    div.setAttribute('aria-live', 'polite');
    div.setAttribute('aria-atomic', 'true');
    div.className = `sr-only ${className}`;
    return div;
  }, []);

  return { updateLiveRegion, createLiveRegion };
}

// Skip to content functionality
export function useSkipToContent() {
  const skipToMain = useCallback(() => {
    const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const createSkipToContentLink = useCallback((className: string = '') => {
    const link = document.createElement('a');
    link.href = '#main-content';
    link.textContent = 'Skip to main content';
    link.className = `sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded ${className}`;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      skipToMain();
    });
    return link;
  }, [skipToMain]);

  return { skipToMain, createSkipToContentLink };
}

// Form accessibility helpers
export function useFormA11y() {
  const getAriaDescribedBy = useCallback((fieldId: string, hasError: boolean, hasHelp: boolean) => {
    const parts = [];
    if (hasError) parts.push(`${fieldId}-error`);
    if (hasHelp) parts.push(`${fieldId}-help`);
    return parts.length > 0 ? parts.join(' ') : undefined;
  }, []);

  const getFieldProps = useCallback((
    fieldId: string,
    { hasError = false, hasHelp = false, required = false } = {}
  ) => ({
    id: fieldId,
    'aria-describedby': getAriaDescribedBy(fieldId, hasError, hasHelp),
    'aria-invalid': hasError,
    'aria-required': required,
  }), [getAriaDescribedBy]);

  return { getAriaDescribedBy, getFieldProps };
}

// Color contrast utilities
export function useColorContrast() {
  const calculateContrast = useCallback((foreground: string, background: string): number => {
    const getRGB = (color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
      return [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
    };

    const getLuminance = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

    const [fgLum, bgLum] = [foreground, background].map(color => getLuminance(getRGB(color)));
    const brightest = Math.max(fgLum, bgLum);
    const darkest = Math.min(fgLum, bgLum);

    return (brightest + 0.05) / (darkest + 0.05);
  }, []);

  const checkContrastCompliance = useCallback((contrast: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal') => {
    const thresholds = {
      AA: { normal: 4.5, large: 3 },
      AAA: { normal: 7, large: 4.5 }
    };

    return contrast >= thresholds[level][size];
  }, []);

  return { calculateContrast, checkContrastCompliance };
}