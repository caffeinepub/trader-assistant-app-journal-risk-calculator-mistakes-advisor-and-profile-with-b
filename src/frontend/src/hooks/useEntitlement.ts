import { useGetCallerPlan } from './useQueries';
import { SubscriptionPlan } from '../backend';

export interface Entitlement {
  hasJournal: boolean;
  hasCalculator: boolean;
  hasMistakes: boolean;
  planName: string;
  isTrial: boolean;
  isExpired: boolean;
}

export function useEntitlement(): Entitlement & { isLoading: boolean } {
  const { data: planState, isLoading } = useGetCallerPlan();

  // While loading, show basic access
  if (isLoading) {
    return {
      hasJournal: false,
      hasCalculator: false,
      hasMistakes: false,
      planName: 'Loading...',
      isTrial: false,
      isExpired: false,
      isLoading: true,
    };
  }

  // If no plan state (null), user hasn't created profile yet
  if (!planState) {
    return {
      hasJournal: false,
      hasCalculator: false,
      hasMistakes: false,
      planName: 'No Plan',
      isTrial: false,
      isExpired: false,
      isLoading: false,
    };
  }

  // Handle trial state - all features unlocked
  if (planState.__kind__ === 'trial') {
    return {
      hasJournal: true,
      hasCalculator: true,
      hasMistakes: true,
      planName: '2-Day Free Trial',
      isTrial: true,
      isExpired: false,
      isLoading: false,
    };
  }

  // Handle expired state - no access
  if (planState.__kind__ === 'expired') {
    return {
      hasJournal: false,
      hasCalculator: false,
      hasMistakes: false,
      planName: 'Trial Expired',
      isTrial: false,
      isExpired: true,
      isLoading: false,
    };
  }

  // Handle paid plans
  if (planState.__kind__ === 'paid') {
    const plan = planState.paid;
    
    switch (plan) {
      case SubscriptionPlan.basic:
        return {
          hasJournal: true,
          hasCalculator: false,
          hasMistakes: false,
          planName: 'Basic Plan',
          isTrial: false,
          isExpired: false,
          isLoading: false,
        };
      case SubscriptionPlan.pro:
        return {
          hasJournal: true,
          hasCalculator: true,
          hasMistakes: false,
          planName: 'Pro Plan',
          isTrial: false,
          isExpired: false,
          isLoading: false,
        };
      case SubscriptionPlan.premium:
        return {
          hasJournal: true,
          hasCalculator: true,
          hasMistakes: true,
          planName: 'Premium Plan',
          isTrial: false,
          isExpired: false,
          isLoading: false,
        };
      default:
        return {
          hasJournal: false,
          hasCalculator: false,
          hasMistakes: false,
          planName: 'Unknown Plan',
          isTrial: false,
          isExpired: false,
          isLoading: false,
        };
    }
  }

  // Fallback
  return {
    hasJournal: false,
    hasCalculator: false,
    hasMistakes: false,
    planName: 'No Plan',
    isTrial: false,
    isExpired: false,
    isLoading: false,
  };
}
