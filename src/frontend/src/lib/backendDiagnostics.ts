/**
 * Backend diagnostics helper to provide detailed information about the backend target
 */

export interface BackendDiagnostics {
  canisterId: string;
  host: string;
  origin: string;
  userAgent: string;
  timestamp: string;
}

/**
 * Attempts to extract canister ID from the current environment
 */
function getCanisterIdFromEnvironment(): string {
  // Try to get from window globals (set by dfx)
  if (typeof window !== 'undefined') {
    const globals = window as any;
    if (globals.canisterId) {
      return globals.canisterId;
    }
    if (globals.BACKEND_CANISTER_ID) {
      return globals.BACKEND_CANISTER_ID;
    }
  }
  
  // Try to extract from URL if on IC network
  const hostname = window.location.hostname;
  if (hostname.includes('.ic0.app') || hostname.includes('.icp0.io')) {
    const parts = hostname.split('.');
    if (parts.length > 0) {
      return parts[0];
    }
  }
  
  return 'unknown (local development or not yet configured)';
}

/**
 * Collects diagnostic information about the backend connection target
 */
export function getBackendDiagnostics(): BackendDiagnostics {
  return {
    canisterId: getCanisterIdFromEnvironment(),
    host: window.location.host,
    origin: window.location.origin,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formats diagnostics as a readable string for display
 */
export function formatDiagnostics(diagnostics: BackendDiagnostics): string {
  return `Backend Canister ID: ${diagnostics.canisterId}
Host: ${diagnostics.host}
Origin: ${diagnostics.origin}
Timestamp: ${diagnostics.timestamp}
User Agent: ${diagnostics.userAgent}`;
}
