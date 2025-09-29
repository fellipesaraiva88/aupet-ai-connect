import { useState, useEffect, useCallback, useRef } from 'react';

interface KeyboardState {
  isOpen: boolean;
  height: number;
  isSupported: boolean;
  visualViewport: {
    height: number;
    width: number;
    offsetTop: number;
    offsetLeft: number;
    scale: number;
  } | null;
}

interface KeyboardOptions {
  threshold?: number; // Height difference threshold to detect keyboard
  debounceMs?: number;
  adjustScrolling?: boolean;
  adjustLayout?: boolean;
  preventZoom?: boolean;
}

export function useMobileKeyboard(options: KeyboardOptions = {}) {
  const {
    threshold = 150,
    debounceMs = 100,
    adjustScrolling = true,
    adjustLayout = true,
    preventZoom = true
  } = options;

  const [keyboardState, setKeyboardState] = useState<KeyboardState>(() => {
    const initialViewport = window.visualViewport;
    return {
      isOpen: false,
      height: 0,
      isSupported: !!initialViewport,
      visualViewport: initialViewport ? {
        height: initialViewport.height,
        width: initialViewport.width,
        offsetTop: initialViewport.offsetTop,
        offsetLeft: initialViewport.offsetLeft,
        scale: initialViewport.scale
      } : null
    };
  });

  const previousHeight = useRef(window.innerHeight);
  const activeElement = useRef<HTMLElement | null>(null);
  const scrollPosition = useRef<number>(0);

  // Detect keyboard open/close based on visual viewport or window resize
  const detectKeyboardState = useCallback(() => {
    if (window.visualViewport) {
      // Use Visual Viewport API (preferred method)
      const viewport = window.visualViewport;
      const keyboardHeight = window.innerHeight - viewport.height;
      const isOpen = keyboardHeight > threshold;

      setKeyboardState(prev => ({
        ...prev,
        isOpen,
        height: isOpen ? keyboardHeight : 0,
        visualViewport: {
          height: viewport.height,
          width: viewport.width,
          offsetTop: viewport.offsetTop,
          offsetLeft: viewport.offsetLeft,
          scale: viewport.scale
        }
      }));

      return { isOpen, height: keyboardHeight };
    } else {
      // Fallback to window resize detection
      const currentHeight = window.innerHeight;
      const heightDiff = previousHeight.current - currentHeight;
      const isOpen = heightDiff > threshold;

      setKeyboardState(prev => ({
        ...prev,
        isOpen,
        height: isOpen ? heightDiff : 0,
        visualViewport: null
      }));

      previousHeight.current = currentHeight;
      return { isOpen, height: isOpen ? heightDiff : 0 };
    }
  }, [threshold]);

  // Debounced keyboard detection
  const debouncedDetect = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(detectKeyboardState, debounceMs);
    };
  }, [detectKeyboardState, debounceMs]);

  // Handle focus on input elements
  const handleFocus = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (isInputElement(target)) {
      activeElement.current = target;

      // Store current scroll position
      scrollPosition.current = window.scrollY;

      // Prevent zoom on iOS
      if (preventZoom && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        const metaViewport = document.querySelector('meta[name=viewport]') as HTMLMetaElement;
        if (metaViewport) {
          const currentContent = metaViewport.content;
          metaViewport.content = currentContent.replace(/maximum-scale=[^,]*,?/g, '') + ', maximum-scale=1.0';

          // Restore after a delay
          setTimeout(() => {
            metaViewport.content = currentContent;
          }, 1000);
        }
      }

      // Scroll input into view if needed
      if (adjustScrolling) {
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    }
  }, [preventZoom, adjustScrolling]);

  // Handle blur on input elements
  const handleBlur = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (isInputElement(target)) {
      activeElement.current = null;
    }
  }, []);

  // Utility to check if element is an input
  function isInputElement(element: HTMLElement): boolean {
    const inputTypes = ['input', 'textarea', 'select'];
    const tagName = element.tagName.toLowerCase();

    if (inputTypes.includes(tagName)) return true;

    // Check for contenteditable
    if (element.contentEditable === 'true') return true;

    // Check for role="textbox"
    if (element.getAttribute('role') === 'textbox') return true;

    return false;
  }

  // Get keyboard-safe area height
  const getSafeAreaHeight = useCallback(() => {
    if (keyboardState.visualViewport) {
      return keyboardState.visualViewport.height;
    }
    return window.innerHeight - keyboardState.height;
  }, [keyboardState]);

  // Get CSS custom properties for keyboard adjustment
  const getKeyboardStyles = useCallback(() => {
    const safeHeight = getSafeAreaHeight();
    return {
      '--keyboard-height': `${keyboardState.height}px`,
      '--safe-area-height': `${safeHeight}px`,
      '--viewport-height': keyboardState.visualViewport
        ? `${keyboardState.visualViewport.height}px`
        : `${window.innerHeight}px`
    };
  }, [keyboardState, getSafeAreaHeight]);

  // Scroll active element into view
  const scrollActiveElementIntoView = useCallback(() => {
    if (!activeElement.current || !keyboardState.isOpen) return;

    const element = activeElement.current;
    const rect = element.getBoundingClientRect();
    const safeHeight = getSafeAreaHeight();

    // Check if element is obscured by keyboard
    if (rect.bottom > safeHeight) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [keyboardState.isOpen, getSafeAreaHeight]);

  // Setup event listeners
  useEffect(() => {
    const debounced = debouncedDetect();

    if (window.visualViewport) {
      // Use Visual Viewport API events
      window.visualViewport.addEventListener('resize', debounced);
      window.visualViewport.addEventListener('scroll', debounced);

      return () => {
        window.visualViewport?.removeEventListener('resize', debounced);
        window.visualViewport?.removeEventListener('scroll', debounced);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', debounced);

      return () => {
        window.removeEventListener('resize', debounced);
      };
    }
  }, [debouncedDetect]);

  // Setup focus/blur listeners for input elements
  useEffect(() => {
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [handleFocus, handleBlur]);

  // Apply CSS custom properties
  useEffect(() => {
    if (adjustLayout) {
      const styles = getKeyboardStyles();
      Object.entries(styles).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });

      return () => {
        Object.keys(styles).forEach(property => {
          document.documentElement.style.removeProperty(property);
        });
      };
    }
  }, [adjustLayout, getKeyboardStyles]);

  return {
    ...keyboardState,
    activeElement: activeElement.current,
    safeAreaHeight: getSafeAreaHeight(),
    scrollActiveElementIntoView,
    getKeyboardStyles
  };
}

// Hook for keyboard-aware form management
export function useKeyboardForm(formRef?: React.RefObject<HTMLFormElement>) {
  const keyboard = useMobileKeyboard({ adjustScrolling: true });
  const [activeField, setActiveField] = useState<HTMLElement | null>(null);

  const handleFieldFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setActiveField(e.target);
  }, []);

  const handleFieldBlur = useCallback(() => {
    setActiveField(null);
  }, []);

  // Scroll form into view when keyboard opens
  useEffect(() => {
    if (keyboard.isOpen && activeField && formRef?.current) {
      setTimeout(() => {
        const formRect = formRef.current!.getBoundingClientRect();
        const fieldRect = activeField.getBoundingClientRect();

        // Calculate if field is visible in safe area
        const safeBottom = keyboard.safeAreaHeight;

        if (fieldRect.bottom > safeBottom) {
          // Scroll to show the field
          const scrollAmount = fieldRect.bottom - safeBottom + 20;
          window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  }, [keyboard.isOpen, activeField, formRef, keyboard.safeAreaHeight]);

  return {
    keyboard,
    activeField,
    fieldProps: {
      onFocus: handleFieldFocus,
      onBlur: handleFieldBlur
    }
  };
}

// Hook for keyboard-aware layout adjustments
export function useKeyboardLayout() {
  const keyboard = useMobileKeyboard({ adjustLayout: true });

  const getContainerStyles = useCallback((position: 'fixed' | 'absolute' | 'sticky' = 'fixed') => {
    if (!keyboard.isOpen) return {};

    return {
      position,
      bottom: `${keyboard.height}px`,
      height: `${keyboard.safeAreaHeight}px`,
      transition: 'all 0.3s ease'
    };
  }, [keyboard]);

  const getModalStyles = useCallback(() => {
    if (!keyboard.isOpen) return {};

    return {
      maxHeight: `${keyboard.safeAreaHeight - 40}px`, // 40px for padding
      overflowY: 'auto' as const
    };
  }, [keyboard]);

  const getBottomSheetStyles = useCallback(() => {
    return {
      paddingBottom: keyboard.isOpen ? `${keyboard.height}px` : '0px',
      transition: 'padding-bottom 0.3s ease'
    };
  }, [keyboard]);

  return {
    keyboard,
    getContainerStyles,
    getModalStyles,
    getBottomSheetStyles,
    cssVariables: keyboard.getKeyboardStyles()
  };
}

// CSS utilities for keyboard-aware layouts
export const keyboardAwareStyles = {
  container: {
    height: 'calc(100vh - var(--keyboard-height, 0px))',
    transition: 'height 0.3s ease'
  },
  bottomFixed: {
    position: 'fixed' as const,
    bottom: 'var(--keyboard-height, 0px)',
    transition: 'bottom 0.3s ease'
  },
  safeArea: {
    height: 'var(--safe-area-height, 100vh)',
    maxHeight: 'var(--safe-area-height, 100vh)'
  }
};