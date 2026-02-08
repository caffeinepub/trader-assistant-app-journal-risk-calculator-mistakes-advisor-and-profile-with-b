import { useState, useEffect, useCallback, useRef } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { isStoppedCanisterError, isHealthCheckError } from '../lib/backendConnectionErrors';

const ACTOR_INITIALIZATION_TIMEOUT = 30000; // 30 seconds (increased from 20)
const INITIAL_RETRY_DELAY = 3000; // 3 seconds
const MAX_RETRY_DELAY = 15000; // 15 seconds
const MAX_AUTO_RETRIES = 8; // Increased from 5

type ActorStatus = 'idle' | 'connecting' | 'ready' | 'error';

interface ActorState {
  actor: backendInterface | null;
  status: ActorStatus;
  error: Error | null;
  isConnecting: boolean;
  isReady: boolean;
  hasError: boolean;
  retryCount: number;
  nextRetryIn: number | null;
}

export function useActorWithStatus() {
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ActorState>({
    actor: null,
    status: 'idle',
    error: null,
    isConnecting: false,
    isReady: false,
    hasError: false,
    retryCount: 0,
    nextRetryIn: null,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRetryingRef = useRef(false);
  const currentRetryCountRef = useRef(0);

  const clearRetryTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const scheduleAutoRetry = useCallback((retryCount: number) => {
    clearRetryTimers();
    
    // Calculate exponential backoff delay
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(1.5, retryCount),
      MAX_RETRY_DELAY
    );
    
    const delaySeconds = Math.ceil(delay / 1000);
    
    setState((prev) => ({
      ...prev,
      nextRetryIn: delaySeconds,
    }));

    // Update countdown every second
    let remainingSeconds = delaySeconds;
    countdownIntervalRef.current = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        return;
      }
      setState((prev) => ({
        ...prev,
        nextRetryIn: remainingSeconds,
      }));
    }, 1000);

    // Schedule the actual retry
    retryTimeoutRef.current = setTimeout(() => {
      if (!isRetryingRef.current) {
        initializeActor(true);
      }
    }, delay);
  }, [clearRetryTimers]);

  const initializeActor = useCallback(async (isAutoRetry = false) => {
    // Prevent duplicate initialization attempts
    if (isRetryingRef.current) {
      return;
    }

    isRetryingRef.current = true;
    clearRetryTimers();

    const newRetryCount = isAutoRetry ? currentRetryCountRef.current + 1 : 0;
    currentRetryCountRef.current = newRetryCount;

    setState((prev) => ({
      ...prev,
      status: 'connecting',
      isConnecting: true,
      isReady: false,
      hasError: false,
      error: null,
      nextRetryIn: null,
      retryCount: newRetryCount,
    }));

    try {
      const actorPromise = (async () => {
        const isAuthenticated = !!identity;

        if (!isAuthenticated) {
          const actor = await createActorWithConfig();
          
          // Health check first
          try {
            await actor.healthCheck();
          } catch (healthError) {
            const healthMsg = healthError instanceof Error ? healthError.message : String(healthError);
            throw new Error(`Health check failed: ${healthMsg}`);
          }
          
          return actor;
        }

        const actorOptions = {
          agentOptions: {
            identity,
          },
        };

        const actor = await createActorWithConfig(actorOptions);
        
        // Health check first
        try {
          await actor.healthCheck();
        } catch (healthError) {
          const healthMsg = healthError instanceof Error ? healthError.message : String(healthError);
          throw new Error(`Health check failed: ${healthMsg}`);
        }
        
        // Then initialize access control
        const adminToken = getSecretParameter('caffeineAdminToken') || '';
        
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (initError) {
          const errorMsg = initError instanceof Error ? initError.message : String(initError);
          if (errorMsg.includes('stopping') || errorMsg.includes('access') || errorMsg.includes('initialization')) {
            throw new Error('Backend is initializing access control. Please refresh the page in a few seconds.');
          }
          throw new Error(`Backend initialization failed: ${errorMsg}`);
        }
        
        return actor;
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Backend connection timed out after 30 seconds. The backend may be starting up or experiencing issues. Try refreshing the page.'));
        }, ACTOR_INITIALIZATION_TIMEOUT);
      });

      const actor = await Promise.race([actorPromise, timeoutPromise]);

      setState({
        actor,
        status: 'ready',
        error: null,
        isConnecting: false,
        isReady: true,
        hasError: false,
        retryCount: 0,
        nextRetryIn: null,
      });

      currentRetryCountRef.current = 0;
      isRetryingRef.current = false;

      // Invalidate all queries when actor is ready
      queryClient.invalidateQueries();
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to connect to backend');
      
      setState((prev) => ({
        ...prev,
        actor: null,
        status: 'error',
        error: errorMessage,
        isConnecting: false,
        isReady: false,
        hasError: true,
        nextRetryIn: null,
      }));

      isRetryingRef.current = false;

      // Auto-retry for stopped canister or health check errors
      const shouldAutoRetry = (isStoppedCanisterError(errorMessage) || isHealthCheckError(errorMessage)) 
        && currentRetryCountRef.current < MAX_AUTO_RETRIES;
      
      if (shouldAutoRetry) {
        scheduleAutoRetry(currentRetryCountRef.current);
      }
    }
  }, [identity, queryClient, clearRetryTimers, scheduleAutoRetry]);

  const retry = useCallback(() => {
    if (!isRetryingRef.current) {
      currentRetryCountRef.current = 0;
      initializeActor(false);
    }
  }, [initializeActor]);

  // Initialize actor when identity changes or on mount
  useEffect(() => {
    if (!isInitializing) {
      initializeActor(false);
    }
  }, [identity?.getPrincipal().toString(), isInitializing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRetryTimers();
    };
  }, [clearRetryTimers]);

  return {
    ...state,
    retry,
  };
}
