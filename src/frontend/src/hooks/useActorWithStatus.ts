import { useState, useEffect, useCallback, useRef } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';

const ACTOR_INITIALIZATION_TIMEOUT = 30000;
const RETRY_DELAY = 3000;
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
  const isRetryingRef = useRef(false);
  const currentRetryCountRef = useRef(0);

  const clearRetryTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const initializeActor = useCallback(async (isAutoRetry = false) => {
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
          await actor.healthCheck();
          return actor;
        }

        const actorOptions = {
          agentOptions: {
            identity,
          },
        };

        const actor = await createActorWithConfig(actorOptions);
        await actor.healthCheck();
        
        const adminToken = getSecretParameter('caffeineAdminToken') || '';
        
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (initError) {
          const errorMsg = initError instanceof Error ? initError.message : String(initError);
          if (!errorMsg.includes('already initialized')) {
            console.warn('Access control initialization warning:', errorMsg);
          }
        }
        
        return actor;
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Backend connection timed out. Please refresh the page.'));
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

      if (currentRetryCountRef.current < MAX_AUTO_RETRIES) {
        retryTimeoutRef.current = setTimeout(() => {
          initializeActor(true);
        }, RETRY_DELAY);
      }
    }
  }, [identity, queryClient, clearRetryTimers]);

  const retry = useCallback(() => {
    clearRetryTimers();
    currentRetryCountRef.current = 0;
    initializeActor(false);
  }, [initializeActor, clearRetryTimers]);

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
