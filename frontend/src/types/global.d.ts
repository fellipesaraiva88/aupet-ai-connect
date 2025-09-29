// Global type declarations for compatibility
declare global {
  interface Window {
    process?: any;
  }
}

// Temporary type overrides for compatibility - simple approach
declare global {
  type Customer = any;
  type Pet = any;
  type Appointment = any;
  type AutoReply = any;
  type IconComponent = any;
}

export {};