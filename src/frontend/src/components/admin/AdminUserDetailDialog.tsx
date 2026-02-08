import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TrendingUp, AlertTriangle, User, Calendar, CreditCard, UserX, CheckCircle, XCircle } from 'lucide-react';
import { UserProfile, TradeEntry, MistakeEntry, SubscriptionState, SubscriptionPlan } from '../../backend';
import { formatSequentialUserId } from '../../lib/userId';
import { useAdminActivateSubscription, useAdminCancelSubscription, useAdminRemoveUser } from '../../hooks/useQueries';
import type { Principal } from '@icp-sdk/core/principal';

interface AdminUserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  principal: Principal;
  profile: UserProfile;
  trades: TradeEntry[];
  mistakes: MistakeEntry[];
  subscriptionState: SubscriptionState | null;
}

export default function AdminUserDetailDialog({
  open,
  onOpenChange,
  principal,
  profile,
  trades,
  mistakes,
  subscriptionState,
}: AdminUserDetailDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const activateSubscription = useAdminActivateSubscription();
  const cancelSubscription = useAdminCancelSubscription();
  const removeUser = useAdminRemoveUser();

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getPlanBadge = (plan: SubscriptionPlan | null) => {
    if (!plan) return <Badge variant="outline">No Plan</Badge>;
    
    switch (plan) {
      case SubscriptionPlan.basic:
        return <Badge variant="secondary">Basic (₹299)</Badge>;
      case SubscriptionPlan.pro:
        return <Badge variant="secondary">Pro (₹799)</Badge>;
      case SubscriptionPlan.premium:
        return <Badge variant="default">Premium (₹999)</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSubscriptionStatus = (subscriptionState: SubscriptionState | null) => {
    if (!subscriptionState) return 'No Subscription';
    
    const now = Date.now() * 1_000_000; // Convert to nanoseconds
    const trialActive = now - Number(subscriptionState.trialStart) < (172_800_000_000_000); // 2 days
    
    if (trialActive) {
      return 'Trial Active';
    } else if (subscriptionState.paidStart) {
      const paidActive = now - Number(subscriptionState.paidStart) < (2_678_400_000_000_000); // 31 days
      return paidActive ? 'Paid Active' : 'Expired';
    } else {
      return 'Trial Expired';
    }
  };

  const handleActivateSubscription = () => {
    if (!selectedPlan) return;
    activateSubscription.mutate(
      { user: principal, plan: selectedPlan },
      {
        onSuccess: () => {
          setShowActivateConfirm(false);
          setSelectedPlan(null);
        },
      }
    );
  };

  const handleCancelSubscription = () => {
    cancelSubscription.mutate(principal, {
      onSuccess: () => {
        setShowCancelConfirm(false);
      },
    });
  };

  const handleRemoveUser = () => {
    removeUser.mutate(principal, {
      onSuccess: () => {
        setShowRemoveConfirm(false);
        onOpenChange(false);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              User Details
            </DialogTitle>
            <DialogDescription>Detailed information and admin controls for this user</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Profile Section */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-xl font-semibold break-words">{profile.fullName}</h3>
                    <p className="text-sm text-muted-foreground break-words">@{profile.username}</p>
                    <p className="text-sm font-mono text-blue-600 font-semibold">
                      {formatSequentialUserId(profile.userId)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getPlanBadge(subscriptionState?.plan ?? null)}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4 shrink-0" />
                      Principal ID
                    </p>
                    <p className="text-xs font-mono break-all">{principal.toString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0" />
                      Member Since
                    </p>
                    <p className="text-sm font-medium break-words">{formatDate(profile.dateJoined)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold">{trades.length}</p>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                  </div>
                  <div className="text-center">
                    <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold">{mistakes.length}</p>
                    <p className="text-sm text-muted-foreground">Mistakes Logged</p>
                  </div>
                  <div className="text-center">
                    <CreditCard className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium break-words">{getSubscriptionStatus(subscriptionState)}</p>
                    <p className="text-sm text-muted-foreground">Subscription</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Controls Section */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Admin Controls</h3>
                
                {/* Activate Subscription */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Activate Subscription Plan</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedPlan ?? undefined} onValueChange={(value) => setSelectedPlan(value as SubscriptionPlan)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SubscriptionPlan.basic}>Basic (₹299)</SelectItem>
                        <SelectItem value={SubscriptionPlan.pro}>Pro (₹799)</SelectItem>
                        <SelectItem value={SubscriptionPlan.premium}>Premium (₹999)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setShowActivateConfirm(true)}
                      disabled={!selectedPlan || activateSubscription.isPending}
                      className="bg-green-600 hover:bg-green-700 shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Cancel Subscription */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Cancel Subscription</p>
                  <Button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={cancelSubscription.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel User Subscription
                  </Button>
                </div>

                <Separator />

                {/* Remove User */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">Remove User</p>
                  <Button
                    onClick={() => setShowRemoveConfirm(true)}
                    disabled={removeUser.isPending}
                    variant="destructive"
                    className="w-full"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Remove User from System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activate Subscription Confirmation */}
      <AlertDialog open={showActivateConfirm} onOpenChange={setShowActivateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Subscription</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Are you sure you want to activate the {selectedPlan} plan for {profile.fullName}? This will grant them immediate access to the plan features for 31 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={activateSubscription.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateSubscription}
              disabled={activateSubscription.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {activateSubscription.isPending ? 'Activating...' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Are you sure you want to cancel the subscription for {profile.fullName}? They will lose access to paid features immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={cancelSubscription.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelSubscription.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {cancelSubscription.isPending ? 'Cancelling...' : 'Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove User Confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Are you sure you want to remove {profile.fullName} from the system? This will permanently delete their profile, trades, mistakes, and subscription data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={removeUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              disabled={removeUser.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeUser.isPending ? 'Removing...' : 'Remove User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
