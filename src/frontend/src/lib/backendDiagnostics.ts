/**
 * Backend diagnostics helper to provide detailed information about the backend target
 */

export interface BackendDiagnostics {
  canisterId: string;
  canisterIdSource: string;
  host: string;
  origin: string;
  userAgent: string;
  timestamp: string;
  deploymentType: 'local' | 'ic-production' | 'caffeine-production' | 'unknown';
  isPossiblyMisconfigured: boolean;
}

/**
 * Attempts to extract canister ID from the current environment
 */
function getCanisterIdFromEnvironment(): { id: string; source: string; isPlaceholder: boolean } {
  // Try to get from window globals (set by dfx, build process, or env.json loader)
  if (typeof window !== 'undefined') {
    const globals = window as any;
    
    // Check for runtime-injected canister ID from env.json loader (highest priority for production)
    if (globals.BACKEND_CANISTER_ID && globals.BACKEND_CANISTER_ID !== 'unknown') {
      const source = globals.__CANISTER_ID_SOURCE__ || 'window.BACKEND_CANISTER_ID';
      return { id: globals.BACKEND_CANISTER_ID, source, isPlaceholder: false };
    }
    
    // Check for explicit canister ID in window (dfx development)
    if (globals.canisterId && globals.canisterId !== 'unknown') {
      return { id: globals.canisterId, source: 'window.canisterId', isPlaceholder: false };
    }
    
    // Check for canister ID in meta tags (production builds may inject this)
    const metaCanisterId = document.querySelector('meta[name="canister-id"]');
    if (metaCanisterId) {
      const content = metaCanisterId.getAttribute('content');
      if (content && content !== 'unknown') {
        return { id: content, source: 'meta[name="canister-id"]', isPlaceholder: false };
      }
    }
  }
  
  // Try to extract from URL if on IC network
  const hostname = window.location.hostname;
  if (hostname.includes('.ic0.app') || hostname.includes('.icp0.io')) {
    const parts = hostname.split('.');
    if (parts.length > 0 && parts[0] && parts[0] !== 'unknown') {
      return { id: parts[0], source: 'hostname (IC domain)', isPlaceholder: false };
    }
  }
  
  // For Caffeine production deployments, the canister ID should be in env.json
  // If we reach here on Caffeine, it means the env.json was not loaded or is missing the ID
  if (hostname.includes('caffeine.xyz') || hostname.includes('caffeine.ai')) {
    return { 
      id: 'unknown', 
      source: 'missing (env.json not loaded or incomplete)', 
      isPlaceholder: true 
    };
  }
  
  return { 
    id: 'unknown', 
    source: 'not found (local development or misconfigured)', 
    isPlaceholder: true 
  };
}

/**
 * Determines the deployment type based on the current environment
 */
function getDeploymentType(): 'local' | 'ic-production' | 'caffeine-production' | 'unknown' {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }
  
  if (hostname.includes('.ic0.app') || hostname.includes('.icp0.io')) {
    return 'ic-production';
  }
  
  if (hostname.includes('caffeine.xyz') || hostname.includes('caffeine.ai')) {
    return 'caffeine-production';
  }
  
  return 'unknown';
}

/**
 * Collects diagnostic information about the backend connection target
 */
export function getBackendDiagnostics(): BackendDiagnostics {
  const canisterInfo = getCanisterIdFromEnvironment();
  const deploymentType = getDeploymentType();
  
  // Detect possible misconfiguration:
  // - Placeholder/unknown canister ID in production
  // - Caffeine production without proper canister ID
  const isPossiblyMisconfigured = 
    canisterInfo.isPlaceholder && 
    (deploymentType === 'caffeine-production' || deploymentType === 'ic-production');
  
  return {
    canisterId: canisterInfo.id,
    canisterIdSource: canisterInfo.source,
    host: window.location.host,
    origin: window.location.origin,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    deploymentType,
    isPossiblyMisconfigured,
  };
}

/**
 * Formats diagnostics as a readable string for display
 */
export function formatDiagnostics(diagnostics: BackendDiagnostics): string {
  return `Deployment Type: ${diagnostics.deploymentType}
Backend Canister ID: ${diagnostics.canisterId}
Canister ID Source: ${diagnostics.canisterIdSource}
Host: ${diagnostics.host}
Origin: ${diagnostics.origin}
Timestamp: ${diagnostics.timestamp}
User Agent: ${diagnostics.userAgent}`;
}
