import { useLocation } from "react-router-dom";

/**
 * Hook to determine the active navigation item based on the current URL path
 */
export function useActiveNavigation(): string {
  const location = useLocation();

  // Extract the main path segment to determine active navigation item
  const path = location.pathname;

  // Map URL paths to navigation item IDs
  if (path === "/" || path === "/dashboard") {
    return "dashboard";
  }

  if (path.startsWith("/conversations")) {
    return "conversations";
  }

  if (path.startsWith("/customers")) {
    return "customers";
  }

  if (path.startsWith("/pets")) {
    return "pets";
  }

  if (path.startsWith("/appointments")) {
    return "appointments";
  }

  if (path.startsWith("/catalog")) {
    return "catalog";
  }

  if (path.startsWith("/ai-config")) {
    return "ai-config";
  }

  if (path.startsWith("/analytics")) {
    return "analytics";
  }

  if (path.startsWith("/settings")) {
    return "settings";
  }

  // Default to dashboard if no match
  return "dashboard";
}