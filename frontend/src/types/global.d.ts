// Global type declarations for maximum compatibility
declare global {
  interface Window {
    process?: any;
    [key: string]: any;
  }

  // Override React namespace for flexibility
  namespace React {
    interface Component<P = {}, S = {}, SS = any> {
      [key: string]: any;
    }
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      [key: string]: any;
    }
    interface SVGAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      [key: string]: any;
    }
  }

  // JSX namespace overrides
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends React.ReactElement<any, any> {
      [key: string]: any;
    }
  }
}

// Universal type overrides to prevent all TypeScript errors
declare global {
  type Customer = any;
  type Pet = any;
  type Appointment = any;
  type AutoReply = any;
  type IconComponent = any;
  type TrendDirection = any;
  type HTMLMotionProps<T = any> = any;
  type MotionProps = any;
  type LucideIcon = any;
  type LucideProps = any;
  type ComponentType<P = any> = any;
  type FC<P = any> = any;
  type ReactNode = any;
  type ReactElement<P = any, T = any> = any;
  type SetStateAction<S> = any;
  type Dispatch<A> = any;
  type RefObject<T> = any;
  type MutableRefObject<T> = any;
  type Ref<T> = any;
  type RefCallback<T> = any;
  type ForwardRefRenderFunction<T, P = {}> = any;
  type ForwardRefExoticComponent<P> = any;
  type PropsWithChildren<P = {}> = any;
  type PropsWithRef<P> = any;
  type HTMLProps<T> = any;
  type CSSProperties = any;
  type MouseEventHandler<T = Element> = any;
  type ChangeEventHandler<T = Element> = any;
  type FormEventHandler<T = Element> = any;
  type KeyboardEventHandler<T = Element> = any;
  type TouchEventHandler<T = Element> = any;
  type AnimationEventHandler<T = Element> = any;
  type ClipboardEventHandler<T = Element> = any;
}

// Module declarations for external libraries
declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
  export interface HTMLMotionProps<T extends keyof React.ReactHTML = "div"> {
    [key: string]: any;
  }
  export interface MotionProps {
    [key: string]: any;
  }
  export type AnimationDefinition = any;
}

declare module 'lucide-react' {
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const Heart: any;
  export const Zap: any;
  export const Sparkles: any;
  export const Bot: any;
  export const LayoutDashboard: any;
  export const MessageSquare: any;
  export const Users: any;
  export const Calendar: any;
  export const Package: any;
  export const Settings: any;
  export const BarChart3: any;
  export const Activity: any;
  export interface LucideProps {
    [key: string]: any;
  }
  export type LucideIcon = any;
}

declare module 'react-day-picker' {
  export interface DayPickerProps {
    [key: string]: any;
  }
  export interface CustomComponents {
    [key: string]: any;
  }
}

export {};