import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorWithStatus } from './useActorWithStatus';
import type { UserProfile, TradeEntry, MistakeEntry, MistakeCategory, SubscriptionPlan, SubscriptionState, PaymentMethod, Discount } from '../backend';
import { toast } from 'sonner';
import type { Principal } from '@icp-sdk/core/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor || hasError,
    retry: false,
  });

  return {
    ...query,
    isLoading: isConnecting || query.isLoading,
    isFetched: (!!actor || hasError) && query.isFetched,
  };
}

export function useCreateUserProfile() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fullName, username }: { fullName: string; username: string }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.createUserProfile(fullName, username);
    },
    onSuccess: () => {
      // Invalidate all subscription-related queries to show trial immediately
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['callerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionState'] });
      toast.success('Profile created successfully! Your 2-day free trial has started.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create profile');
    },
  });
}

export function useSaveUserProfile() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

// Trade Queries
export function useGetAllTrades() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery<TradeEntry[]>({
    queryKey: ['trades'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return [];
      return actor.getAllTrades();
    },
    enabled: !!actor || hasError,
  });
}

export function useCreateTrade() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trade: {
      tradeDate: bigint;
      session: string;
      tradingPair: string;
      stopLoss: number;
      takeProfit: number;
      riskReward: number;
      riskAmount: number;
      outcome: boolean;
    }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.createTradeEntry(
        trade.tradeDate,
        trade.session,
        trade.tradingPair,
        trade.stopLoss,
        trade.takeProfit,
        trade.riskReward,
        trade.riskAmount,
        trade.outcome
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tradeDates'] });
      toast.success('Trade added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add trade');
    },
  });
}

export function useUpdateTrade() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ index, entry }: { index: bigint; entry: TradeEntry }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.updateTradeEntry(index, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tradeDates'] });
      toast.success('Trade updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update trade');
    },
  });
}

export function useDeleteTrade() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (index: bigint) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.deleteTradeEntry(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tradeDates'] });
      toast.success('Trade deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete trade');
    },
  });
}

// Mistake Queries
export function useGetAllMistakes() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery<MistakeEntry[]>({
    queryKey: ['mistakes'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return [];
      return actor.getAllMistakes();
    },
    enabled: !!actor || hasError,
  });
}

export function useCreateMistake() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mistake: { category: MistakeCategory; description: string; tradeDate: bigint }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.createMistakeEntry(mistake.category, mistake.description, mistake.tradeDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistakes'] });
      toast.success('Mistake logged successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to log mistake');
    },
  });
}

export function useUpdateMistake() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mistakeId, description }: { mistakeId: bigint; description: string }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.updateMistakeEntry(mistakeId, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistakes'] });
      toast.success('Mistake updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update mistake');
    },
  });
}

export function useDeleteMistake() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mistakeId: bigint) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.deleteMistakeEntry(mistakeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistakes'] });
      toast.success('Mistake deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete mistake');
    },
  });
}

// Analytics Queries
export function useGetAnalytics(startDate?: bigint, endDate?: bigint) {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery({
    queryKey: ['analytics', startDate?.toString(), endDate?.toString()],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return null;
      return actor.getAnalytics(startDate ?? null, endDate ?? null);
    },
    enabled: !!actor || hasError,
  });
}

export function useGetAllTradeDates() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery<bigint[]>({
    queryKey: ['tradeDates'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return [];
      return actor.getAllTradeDates();
    },
    enabled: !!actor || hasError,
  });
}

// Subscription Queries
export function useGetSubscriptionState() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery<SubscriptionState | null>({
    queryKey: ['subscriptionState'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return null;
      return actor.getSubscriptionState();
    },
    enabled: !!actor || hasError,
  });
}

export function useGetCallerPlan() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery({
    queryKey: ['callerPlan'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return null;
      return actor.getCallerPlan();
    },
    enabled: !!actor || hasError,
  });
}

export function useSelectSubscriptionPlan() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.selectSubscriptionPlan(plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionState'] });
      queryClient.invalidateQueries({ queryKey: ['callerPlan'] });
      toast.success('Subscription plan activated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate subscription plan');
    },
  });
}

export function useCancelTrial() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.cancelTrial();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionState'] });
      queryClient.invalidateQueries({ queryKey: ['callerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['mistakes'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tradeDates'] });
      toast.success('Trial cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel trial');
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor || hasError,
    retry: false,
  });
}

export function useGetAllUserData() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery<[Principal, UserProfile, TradeEntry[], MistakeEntry[], SubscriptionState | null][]>({
    queryKey: ['allUserData'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return [];
      return actor.getAllUserData();
    },
    enabled: false,
    retry: false,
  });
}

export function useAdminActivateSubscription() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, plan }: { user: Principal; plan: SubscriptionPlan }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminActivateSubscription(user, plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserData'] });
      toast.success('Subscription activated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate subscription');
    },
  });
}

export function useAdminCancelSubscription() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminCancelSubscription(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserData'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });
}

export function useAdminRemoveUser() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminRemoveUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserData'] });
      toast.success('User removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove user');
    },
  });
}

// Payment Methods Admin Queries
export function useAdminGetAllPaymentMethods() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery<PaymentMethod[]>({
    queryKey: ['adminPaymentMethods'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return [];
      return actor.adminGetAllPaymentMethods();
    },
    enabled: false,
    retry: false,
  });
}

export function useAdminCreatePaymentMethod() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminCreatePaymentMethod(name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentMethods'] });
      toast.success('Payment method created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payment method');
    },
  });
}

export function useAdminUpdatePaymentMethod() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, description, enabled }: { id: bigint; name: string; description: string; enabled: boolean }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminUpdatePaymentMethod(id, name, description, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentMethods'] });
      toast.success('Payment method updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment method');
    },
  });
}

export function useAdminDeletePaymentMethod() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminDeletePaymentMethod(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentMethods'] });
      toast.success('Payment method deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete payment method');
    },
  });
}

// Discounts Admin Queries
export function useAdminGetAllDiscounts() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();

  return useQuery<Discount[]>({
    queryKey: ['adminDiscounts'],
    queryFn: async () => {
      if (hasError && error) {
        throw error;
      }
      if (!actor) return [];
      return actor.adminGetAllDiscounts();
    },
    enabled: false,
    retry: false,
  });
}

export function useAdminCreateDiscount() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, percentage, validUntil }: { code: string; percentage: number; validUntil: bigint }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminCreateDiscount(code, percentage, validUntil);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscounts'] });
      toast.success('Discount created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create discount');
    },
  });
}

export function useAdminUpdateDiscount() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, code, percentage, validUntil, enabled }: { id: bigint; code: string; percentage: number; validUntil: bigint; enabled: boolean }) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminUpdateDiscount(id, code, percentage, validUntil, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscounts'] });
      toast.success('Discount updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update discount');
    },
  });
}

export function useAdminDeleteDiscount() {
  const { actor, isConnecting, hasError, error } = useActorWithStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (hasError && error) {
        throw error;
      }
      if (!actor || isConnecting) {
        throw new Error('Connecting to backend... Please wait a moment and try again.');
      }
      return actor.adminDeleteDiscount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscounts'] });
      toast.success('Discount deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete discount');
    },
  });
}
