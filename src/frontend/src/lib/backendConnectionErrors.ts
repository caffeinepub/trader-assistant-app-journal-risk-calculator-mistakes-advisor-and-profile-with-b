/**
 * Utility to classify backend connection errors and provide user-friendly messages
 */

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

export function isStoppedCanisterError(error: Error | string): boolean {
  const errorText = typeof error === 'string' ? error : error.message;
  const lowerError = errorText.toLowerCase();
  
  return (
    lowerError.includes('is stopped') ||
    lowerError.includes('ic0508') ||
    (lowerError.includes('canister') && lowerError.includes('stopped'))
  );
}

export function classifyBackendError(error: Error): ErrorClassification {
  const errorMessage = error.message;
  
  if (isAuthorizationError(errorMessage)) {
    return {
      isStoppedCanister: false,
      isAuthorizationError: true,
      isMisconfigured: false,
      title: 'Authorization Error',
      description: 'You do not have permission to access this resource.',
      showRawError: false,
      shouldRetry: false,
    };
  }
  
  if (isStoppedCanisterError(errorMessage)) {
    return {
      isStoppedCanister: true,
      isAuthorizationError: false,
      isMisconfigured: false,
      title: 'Backend Starting',
      description: 'The backend is starting up. Please wait a moment.',
      showRawError: false,
      shouldRetry: true,
    };
  }
  
  return {
    isStoppedCanister: false,
    isAuthorizationError: false,
    isMisconfigured: false,
    title: 'Connection Error',
    description: errorMessage,
    showRawError: true,
    shouldRetry: true,
  };
}
