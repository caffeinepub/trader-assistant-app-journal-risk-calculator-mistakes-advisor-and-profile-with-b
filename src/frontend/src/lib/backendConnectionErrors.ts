/**
 * Utility to classify backend connection errors and provide user-friendly messages
 */

import { getBackendDiagnostics, formatDiagnostics } from './backendDiagnostics';

export interface ErrorClassification {
  isStoppedCanister: boolean;
  title: string;
  description: string;
  showRawError: boolean;
  diagnostics?: string;
}

/**
 * Detects if an error is due to a stopped canister
 */
export function isStoppedCanisterError(error: Error | string): boolean {
  const errorText = typeof error === 'string' ? error : error.message;
  const lowerError = errorText.toLowerCase();
  
  return (
    lowerError.includes('is stopped') ||
    lowerError.includes('ic0508') ||
    lowerError.includes('reject code: 5') ||
    lowerError.includes('reject code 5') ||
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
  const diagnostics = formatDiagnostics(getBackendDiagnostics());
  
  // Check for stopped canister
  if (isStoppedCanisterError(errorMessage)) {
    return {
      isStoppedCanister: true,
      title: 'Backend Canister Stopped',
      description: 'The backend canister appears to be stopped. This is normal after a fresh deployment. The app will automatically retry the connection. You can also refresh the page and wait 10-15 seconds for the backend to start.',
      showRawError: false,
      diagnostics,
    };
  }
  
  // Check for health check failure
  if (isHealthCheckError(errorMessage)) {
    return {
      isStoppedCanister: true,
      title: 'Backend Health Check Failed',
      description: 'The backend health check failed. The backend may be starting up or experiencing issues. The app will automatically retry the connection.',
      showRawError: false,
      diagnostics,
    };
  }
  
  // Check for timeout
  if (errorMessage.includes('timed out')) {
    return {
      isStoppedCanister: false,
      title: 'Connection Timeout',
      description: 'The backend connection timed out. This may indicate the backend is starting up or experiencing issues. Please try again or refresh the page.',
      showRawError: false,
      diagnostics,
    };
  }
  
  // Check for initialization errors
  if (errorMessage.includes('initializing') || errorMessage.includes('initialization')) {
    return {
      isStoppedCanister: false,
      title: 'Backend Initializing',
      description: 'The backend is currently initializing. Please wait a moment and try again.',
      showRawError: false,
      diagnostics,
    };
  }
  
  // Generic backend error
  return {
    isStoppedCanister: false,
    title: 'Connection Error',
    description: errorMessage,
    showRawError: true,
    diagnostics,
  };
}
