import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import { safeErrorMessage } from '../lib/safeErrorMessage';
import type { Principal } from '@icp-sdk/core/principal';
import { SubscriptionPlan, TradeEntry, MistakeCategory, UserProfile, ExternalBlob } from '../backend';

// ============ USER INITIALIZATION ============

/**
 * Initialize user access after login by calling ensureHasUserAndGetSubscriptionState
 * This auto-grants the #user role on the backend before any other queries run
 */
export function useInitializeUserAccess(isAuthenticated: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['initializeUserAccess'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // This call auto-grants #user role on the backend
      await actor.ensureHasUserAndGetSubscriptionState();
      return true;
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: 1,
    staleTime: Infinity, // Only run once per session
  });
}

// ============ TRADE JOURNAL QUERIES ============

export function useGetAllTrades() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTrades();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTrade() {
  const { actor } = useActor();
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
      if (!actor) throw new Error('Actor not available');
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
      queryClient.invalidateQueries({ queryKey: ['tradeDates'] });
      toast.success('Trade entry created successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useUpdateTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ index, entry }: { index: bigint; entry: TradeEntry }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTradeEntry(index, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['tradeDates'] });
      toast.success('Trade entry updated successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useDeleteTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (index: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTradeEntry(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['tradeDates'] });
      toast.success('Trade entry deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

// ============ MISTAKES TRACKING QUERIES ============

export function useGetAllMistakes() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['mistakes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMistakes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMistake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mistake: {
      category: MistakeCategory;
      description: string;
      tradeDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMistakeEntry(mistake.category, mistake.description, mistake.tradeDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistakes'] });
      toast.success('Mistake entry created successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useUpdateMistake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mistakeId, description }: { mistakeId: bigint; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMistakeEntry(mistakeId, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistakes'] });
      toast.success('Mistake entry updated successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useDeleteMistake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mistakeId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMistakeEntry(mistakeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistakes'] });
      toast.success('Mistake entry deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

// ============ ANALYTICS QUERIES ============

export function useGetAnalytics(startDate: bigint | null, endDate: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['analytics', startDate?.toString(), endDate?.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAnalytics(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllTradeDates() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['tradeDates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTradeDates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDailyProfitForDate(date: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['dailyProfit', date?.toString()],
    queryFn: async () => {
      if (!actor || date === null) return 0;
      return actor.getDailyProfitForDate(date);
    },
    enabled: !!actor && !isFetching && date !== null,
  });
}

// ============ USER PROFILE QUERIES ============

export function useGetCallerUserProfile(enabled: boolean = true) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && enabled,
    retry: false,
  });
}

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fullName, username }: { fullName: string; username: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createUserProfile(fullName, username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionState'] });
      toast.success('Profile created successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

// ============ SUBSCRIPTION QUERIES ============

export function useGetSubscriptionState() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['subscriptionState'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.ensureHasUserAndGetSubscriptionState();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerPlan() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['callerPlan'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerPlan();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCancelTrial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.cancelTrial();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionState'] });
      queryClient.invalidateQueries({ queryKey: ['callerPlan'] });
      toast.success('Trial cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

// ============ PAYMENT QUERIES ============

export function useGetEnabledPaymentMethods() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['enabledPaymentMethods'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEnabledPaymentMethods();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetActiveDiscounts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['activeDiscounts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveDiscounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      plan: SubscriptionPlan;
      couponCode: string | null;
      pointsRedeemed: bigint;
      finalAmount: bigint;
      transactionId: string;
      fileType: string;
      fileSize: bigint;
      paymentProof: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPaymentForSubscription(
        payment.plan,
        payment.couponCode,
        payment.pointsRedeemed,
        payment.finalAmount,
        payment.transactionId,
        payment.fileType,
        payment.fileSize,
        payment.paymentProof
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionState'] });
      toast.success('Payment submitted successfully. Awaiting admin approval.');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useGetPaymentQRCode() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['paymentQRCode'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.ensureHasUserAndGetPaymentQRCode();
    },
    enabled: !!actor && !isFetching,
  });
}

// ============ ADMIN QUERIES ============

export function useUnlockAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlockAdmin(password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isLockedAdmin'] });
      toast.success('Admin access unlocked');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useIsLockedAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['isLockedAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isLockedAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsPermanentAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['isPermanentAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminRotatePassword() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (newPassword: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminSetUnlockPassword(newPassword);
    },
    onSuccess: () => {
      toast.success('Admin password updated successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsersWithIds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetAllUserData() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminAllUserData'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserData();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminActivateSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, plan }: { user: Principal; plan: SubscriptionPlan }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminActivateSubscription(user, plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUserData'] });
      toast.success('Subscription activated successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminCancelSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminCancelSubscription(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUserData'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminRemoveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminRemoveUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUserData'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      toast.success('User removed successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

// ============ ADMIN PAYMENT METHOD QUERIES ============

export function useAdminGetAllPaymentMethods() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminPaymentMethods'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllPaymentMethods();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminCreatePaymentMethod() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminCreatePaymentMethod(name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['enabledPaymentMethods'] });
      toast.success('Payment method created successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminUpdatePaymentMethod() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      enabled,
    }: {
      id: bigint;
      name: string;
      description: string;
      enabled: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminUpdatePaymentMethod(id, name, description, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['enabledPaymentMethods'] });
      toast.success('Payment method updated successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminDeletePaymentMethod() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminDeletePaymentMethod(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['enabledPaymentMethods'] });
      toast.success('Payment method deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

// ============ ADMIN DISCOUNT QUERIES ============

export function useAdminGetAllDiscounts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminDiscounts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllDiscounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminCreateDiscount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      percentage,
      validUntil,
    }: {
      code: string;
      percentage: number;
      validUntil: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminCreateDiscount(code, percentage, validUntil);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscounts'] });
      queryClient.invalidateQueries({ queryKey: ['activeDiscounts'] });
      toast.success('Discount created successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminUpdateDiscount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      code,
      percentage,
      validUntil,
      enabled,
    }: {
      id: bigint;
      code: string;
      percentage: number;
      validUntil: bigint;
      enabled: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminUpdateDiscount(id, code, percentage, validUntil, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscounts'] });
      queryClient.invalidateQueries({ queryKey: ['activeDiscounts'] });
      toast.success('Discount updated successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminDeleteDiscount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminDeleteDiscount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDiscounts'] });
      queryClient.invalidateQueries({ queryKey: ['activeDiscounts'] });
      toast.success('Discount deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

// ============ ADMIN PENDING PAYMENTS QUERIES ============

export function useAdminGetPendingPayments() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminPendingPayments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetPendingPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminApprovePayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminReviewAndApprovePayment(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPendingPayments'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllUserData'] });
      toast.success('Payment approved successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminRejectPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, reason }: { user: Principal; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminRejectPayment(user, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPendingPayments'] });
      toast.success('Payment rejected successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

// ============ ADMIN PAYMENT QR CODE QUERIES ============

export function useAdminUploadPaymentQRCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blob: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadPaymentQRCode(blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentQRCode'] });
      toast.success('Payment QR code uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}

export function useAdminClearPaymentQRCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearPaymentQRCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentQRCode'] });
      toast.success('Payment QR code cleared successfully');
    },
    onError: (error: Error) => {
      toast.error(safeErrorMessage(error));
    },
  });
}
