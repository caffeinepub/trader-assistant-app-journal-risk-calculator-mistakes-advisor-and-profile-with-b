/**
 * Backend diagnostics helper
 */

export interface BackendDiagnostics {
  canisterId: string;
  canisterIdSource: string;
  host: string;
  origin: string;
  timestamp: string;
  deploymentType: 'local' | 'ic-production' | 'caffeine-production' | 'unknown';
  isPossiblyMisconfigured: boolean;
}

function getCanisterIdFromEnvironment(): { id: string; source: string; isPlaceholder: boolean } {
  if (typeof window !== 'undefined') {
    const globals = window as any;
    
    if (globals.BACKEND_CANISTER_ID && globals.BACKEND_CANISTER_ID !== '__BACKEND_CANISTER_ID__') {
      return { id: globals.BACKEND_CANISTER_ID, source: 'window.BACKEND_CANISTER_ID', isPlaceholder: false };
    }
    
    if (globals.canisterId) {
      return { id: globals.canisterId, source: 'window.canisterId', isPlaceholder: false };
    }
  }
  
  const hostname = window.location.hostname;
  if (hostname.includes('.ic0.app') || hostname.includes('.icp0.io')) {
    const parts = hostname.split('.');
    if (parts.length > 0 && parts[0]) {
      return { id: parts[0], source: 'hostname', isPlaceholder: false };
    }
  }
  
  return { id: 'unknown', source: 'not found', isPlaceholder: true };
}

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

export function getBackendDiagnostics(): BackendDiagnostics {
  const canisterInfo = getCanisterIdFromEnvironment();
  const deploymentType = getDeploymentType();
  
  const isPossiblyMisconfigured = 
    canisterInfo.isPlaceholder && 
    (deploymentType === 'caffeine-production' || deploymentType === 'ic-production');
  
  return {
    canisterId: canisterInfo.id,
    canisterIdSource: canisterInfo.source,
    host: window.location.host,
    origin: window.location.origin,
    timestamp: new Date().toISOString(),
    deploymentType,
    isPossiblyMisconfigured,
  };
}

export function formatDiagnostics(diagnostics: BackendDiagnostics): string {
  return JSON.stringify(diagnostics, null, 2);
}
