import { useState, useEffect, useCallback, useRef } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { isStoppedCanisterError } from '../lib/backendConnectionErrors';

const ACTOR_INITIALIZATION_TIMEOUT = 20000; // 20 seconds
const INITIAL_RETRY_DELAY = 3000; // 3 seconds
const MAX_RETRY_DELAY = 15000; // 15 seconds
const MAX_AUTO_RETRIES = 5;

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
    
    setState((prev) => ({
      ...prev,
      nextRetryIn: Math.ceil(delay / 1000),
    }));

    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.nextRetryIn === null || prev.nextRetryIn <= 1) {
          return prev;
        }
        return {
          ...prev,
          nextRetryIn: prev.nextRetryIn - 1,
        };
      });
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

    setState((prev) => ({
      ...prev,
      status: 'connecting',
      isConnecting: true,
      isReady: false,
      hasError: false,
      error: null,
      nextRetryIn: null,
      retryCount: isAutoRetry ? prev.retryCount + 1 : 0,
    }));

    try {
      const actorPromise = (async () => {
        const isAuthenticated = !!identity;

        if (!isAuthenticated) {
          return await createActorWithConfig();
        }

        const actorOptions = {
          agentOptions: {
            identity,
          },
        };

        const actor = await createActorWithConfig(actorOptions);
        const adminToken = getSecretParameter('caffeineAdminToken') || '';
        
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (initError) {
          // Classify access control initialization errors
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
          reject(new Error('Backend connection timed out after 20 seconds. The backend may be starting up or experiencing issues. Try refreshing the page.'));
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

      isRetryingRef.current = false;

      // Invalidate all queries when actor is ready
      queryClient.invalidateQueries();
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to connect to backend');
      const currentRetryCount = state.retryCount + (isAutoRetry ? 1 : 0);
      
      setState({
        actor: null,
        status: 'error',
        error: errorMessage,
        isConnecting: false,
        isReady: false,
        hasError: true,
        retryCount: currentRetryCount,
        nextRetryIn: null,
      });

      isRetryingRef.current = false;

      // Auto-retry for stopped canister errors
      if (isStoppedCanisterError(errorMessage) && currentRetryCount < MAX_AUTO_RETRIES) {
        scheduleAutoRetry(currentRetryCount);
      }
    }
  }, [identity, queryClient, clearRetryTimers, scheduleAutoRetry, state.retryCount]);

  const retry = useCallback(() => {
    if (!isRetryingRef.current) {
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
