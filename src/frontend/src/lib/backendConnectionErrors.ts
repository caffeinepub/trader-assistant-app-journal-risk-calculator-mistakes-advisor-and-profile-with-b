/**
 * Utility to classify backend connection errors and provide user-friendly messages
 */

import { getBackendDiagnostics, formatDiagnostics } from './backendDiagnostics';

export interface ErrorClassification {
  isStoppedCanister: boolean;
  isAuthorizationError: boolean;
  isMisconfigured: boolean;
  title: string;
  description: string;
  showRawError: boolean;
  diagnostics?: string;
  shouldRetry: boolean;
}

/**
 * Detects if an error is due to authorization/permission issues
 */
export function isAuthorizationError(error: Error | string): boolean {
  const errorText = typeof error === 'string' ? error : error.message;
  const lowerError = errorText.toLowerCase();
  
  return (
    lowerError.includes('unauthorized') ||
    lowerError.includes('only users can') ||
    lowerError.includes('only admins can') ||
    lowerError.includes('permission denied') ||
    lowerError.includes('access denied')
  );
}

/**
 * Detects if an error is due to a stopped canister
 */
export function isStoppedCanisterError(error: Error | string): boolean {
  const errorText = typeof error === 'string' ? error : error.message;
  const lowerError = errorText.toLowerCase();
  
  // Only match explicit stopped canister errors, not generic reject codes
  return (
    lowerError.includes('is stopped') ||
    lowerError.includes('ic0508') ||
    (lowerError.includes('canister') && lowerError.includes('stopped')) ||
    lowerError.includes('canister is not running') ||
    lowerError.includes('canister has been stopped')
  );
}

/**
 * Detects if an error is due to health check failure
 */
export function isHealthCheckError(error: Error | string): boolean {
  const errorText = typeof error === 'string' ? error : error.message;
  const lowerError = errorText.toLowerCase();
  
  return (
    lowerError.includes('health check') ||
    lowerError.includes('healthcheck')
  );
}

/**
 * Classifies an error and returns user-friendly messaging
 */
export function classifyBackendError(error: Error): ErrorClassification {
  const errorMessage = error.message;
  const diagnosticsData = getBackendDiagnostics();
  const diagnostics = formatDiagnostics(diagnosticsData);
  
  // Check for possible misconfiguration (placeholder/unknown canister ID in production)
  const isMisconfigured = diagnosticsData.isPossiblyMisconfigured;
  
  // If misconfigured, this is the primary issue - don't retry
  if (isMisconfigured) {
    return {
      isStoppedCanister: false,
      isAuthorizationError: false,
      isMisconfigured: true,
      title: 'Backend Configuration Error',
      description: 'The backend canister ID is missing or unresolved. This deployment appears to be incomplete. The canister targeting information needs to be configured properly. Please contact the deployment administrator or redeploy the application with the correct backend canister ID.',
      showRawError: false,
      diagnostics,
      shouldRetry: false,
    };
  }
  
  // Check for authorization errors (before stopped canister)
  if (isAuthorizationError(errorMessage)) {
    return {
      isStoppedCanister: false,
      isAuthorizationError: true,
      isMisconfigured: false,
      title: 'Authorization Error',
      description: 'You do not have permission to access this resource. Please try logging out and logging in again, or contact support if the issue persists.',
      showRawError: false,
      diagnostics,
      shouldRetry: false,
    };
  }
  
  // Check for stopped canister
  if (isStoppedCanisterError(errorMessage)) {
    return {
      isStoppedCanister: true,
      isAuthorizationError: false,
      isMisconfigured: false,
      title: 'Backend Canister Stopped',
      description: 'The backend canister appears to be stopped. This is normal after a fresh deployment. The app will automatically retry the connection. You can also refresh the page and wait 10-15 seconds for the backend to start.',
      showRawError: false,
      diagnostics,
      shouldRetry: true,
    };
  }
  
  // Check for health check failure
  if (isHealthCheckError(errorMessage)) {
    return {
      isStoppedCanister: true,
      isAuthorizationError: false,
      isMisconfigured: false,
      title: 'Backend Health Check Failed',
      description: 'The backend health check failed. The backend may be starting up or experiencing issues. The app will automatically retry the connection.',
      showRawError: false,
      diagnostics,
      shouldRetry: true,
    };
  }
  
  // Check for timeout
  if (errorMessage.includes('timed out')) {
    return {
      isStoppedCanister: false,
      isAuthorizationError: false,
      isMisconfigured: false,
      title: 'Connection Timeout',
      description: 'The backend connection timed out. This may indicate the backend is starting up or experiencing issues. Please try again or refresh the page.',
      showRawError: false,
      diagnostics,
      shouldRetry: true,
    };
  }
  
  // Check for initialization errors
  if (errorMessage.includes('initializing') || errorMessage.includes('initialization')) {
    return {
      isStoppedCanister: false,
      isAuthorizationError: false,
      isMisconfigured: false,
      title: 'Backend Initializing',
      description: 'The backend is currently initializing. Please wait a moment and try again.',
      showRawError: false,
      diagnostics,
      shouldRetry: true,
    };
  }
  
  // Generic backend error
  return {
    isStoppedCanister: false,
    isAuthorizationError: false,
    isMisconfigured: false,
    title: 'Connection Error',
    description: errorMessage,
    showRawError: true,
    diagnostics,
    shouldRetry: true,
  };
}
