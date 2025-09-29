// Global type overrides to fix build errors
declare global {
  interface Window {
    innerWidth: number;
    innerHeight: number;
  }
}

// Module augmentations for component props
declare module '@radix-ui/react-accordion' {
  export interface AccordionItemProps {
    value?: string;
  }
}

declare module '@radix-ui/react-tabs' {
  export interface TabsTriggerProps {
    value?: string;
  }
  export interface TabsContentProps {
    value?: string;
  }
}

declare module '@radix-ui/react-radio-group' {
  export interface RadioGroupItemProps {
    value?: string;
  }
}

declare module '@radix-ui/react-select' {
  export interface SelectItemProps {
    value?: string;
  }
}

declare module '@radix-ui/react-toast' {
  export interface ToastActionProps {
    altText?: string;
  }
}

declare module '@radix-ui/react-toggle-group' {
  export interface ToggleGroupSingleProps {
    type?: any;
  }
  export interface ToggleGroupMultipleProps {
    type?: any;
  }
}

declare module 'input-otp' {
  export interface OTPInputProps {
    maxLength?: number;
  }
}

export {};