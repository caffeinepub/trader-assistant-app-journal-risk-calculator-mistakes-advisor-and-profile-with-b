import { useState, useEffect, useCallback, useRef } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { classifyBackendError } from '../lib/backendConnectionErrors';

const ACTOR_INITIALIZATION_TIMEOUT = 45000; // 45 seconds (increased for production)
const INITIAL_RETRY_DELAY = 4000; // 4 seconds
const MAX_RETRY_DELAY = 20000; // 20 seconds
const MAX_AUTO_RETRIES = 12; // Increased for production deployments

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
  const initializerRef = useRef<(() => Promise<void>) | null>(null);

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
          
          // Health check first - with retry for production
          let healthCheckAttempts = 0;
          const maxHealthCheckAttempts = 3;
          
          while (healthCheckAttempts < maxHealthCheckAttempts) {
            try {
              await actor.healthCheck();
              break; // Success
            } catch (healthError) {
              healthCheckAttempts++;
              if (healthCheckAttempts >= maxHealthCheckAttempts) {
                const healthMsg = healthError instanceof Error ? healthError.message : String(healthError);
                throw new Error(`Health check failed after ${maxHealthCheckAttempts} attempts: ${healthMsg}`);
              }
              // Wait 2 seconds before retry
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          return actor;
        }

        const actorOptions = {
          agentOptions: {
            identity,
          },
        };

        const actor = await createActorWithConfig(actorOptions);
        
        // Health check first - with retry for production
        let healthCheckAttempts = 0;
        const maxHealthCheckAttempts = 3;
        
        while (healthCheckAttempts < maxHealthCheckAttempts) {
          try {
            await actor.healthCheck();
            break; // Success
          } catch (healthError) {
            healthCheckAttempts++;
            if (healthCheckAttempts >= maxHealthCheckAttempts) {
              const healthMsg = healthError instanceof Error ? healthError.message : String(healthError);
              throw new Error(`Health check failed after ${maxHealthCheckAttempts} attempts: ${healthMsg}`);
            }
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        // Then initialize access control (only for authenticated users)
        const adminToken = getSecretParameter('caffeineAdminToken') || '';
        
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (initError) {
          const errorMsg = initError instanceof Error ? initError.message : String(initError);
          // Don't fail on access control initialization errors - the backend may already be initialized
          if (!errorMsg.includes('already initialized')) {
            console.warn('Access control initialization warning:', errorMsg);
          }
        }
        
        return actor;
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Backend connection timed out after 45 seconds. The backend may be starting up or experiencing issues. Please refresh the page and wait 15-20 seconds.'));
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

      // Classify the error to determine if we should retry
      const classification = classifyBackendError(errorMessage);
      
      // Only auto-retry if the error classification says we should AND we haven't exceeded max retries
      const shouldAutoRetry = classification.shouldRetry && currentRetryCountRef.current < MAX_AUTO_RETRIES;
      
      if (shouldAutoRetry) {
        scheduleAutoRetry(currentRetryCountRef.current);
      }
    }
  }, [identity, queryClient, clearRetryTimers]);

  // Store the latest initializer in a ref so scheduled retries always use the current version
  useEffect(() => {
    initializerRef.current = () => initializeActor(true);
  }, [initializeActor]);

  const scheduleAutoRetry = useCallback((retryCount: number) => {
    clearRetryTimers();

    // Exponential backoff with max delay
    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(1.5, retryCount), MAX_RETRY_DELAY);
    let remainingSeconds = Math.ceil(delay / 1000);

    setState((prev) => ({
      ...prev,
      nextRetryIn: remainingSeconds,
    }));

    // Countdown timer
    countdownIntervalRef.current = setInterval(() => {
      remainingSeconds -= 1;
      setState((prev) => ({
        ...prev,
        nextRetryIn: Math.max(0, remainingSeconds),
      }));

      if (remainingSeconds <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }, 1000);

    // Schedule the actual retry
    retryTimeoutRef.current = setTimeout(() => {
      if (initializerRef.current) {
        initializerRef.current();
      }
    }, delay);
  }, [clearRetryTimers]);

  const retry = useCallback(() => {
    clearRetryTimers();
    currentRetryCountRef.current = 0;
    initializeActor(false);
  }, [initializeActor, clearRetryTimers]);

  // Initialize actor when identity changes or on mount
  useEffect(() => {
    if (!isInitializing) {
      initializeActor(false);
    }

    return () => {
      clearRetryTimers();
    };
  }, [identity, isInitializing, initializeActor, clearRetryTimers]);

  return {
    actor: state.actor,
    status: state.status,
    error: state.error,
    isConnecting: state.isConnecting,
    isReady: state.isReady,
    hasError: state.hasError,
    retry,
    retryCount: state.retryCount,
    nextRetryIn: state.nextRetryIn,
  };
}
