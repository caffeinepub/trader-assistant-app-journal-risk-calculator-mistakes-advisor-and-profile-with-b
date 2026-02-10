import { useState } from 'react';
import { useGetSubscriptionState, useCancelTrial } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Clock, XCircle, Sparkles } from 'lucide-react';
import PaymentView from './PaymentView';
import { SubscriptionPlan } from '../../backend';

export default function SubscriptionsView() {
  const { data: subscriptionState, isLoading } = useGetSubscriptionState();
  const cancelTrial = useCancelTrial();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionState) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load subscription information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Show payment view if a plan is selected
  if (selectedPlan) {
    return <PaymentView plan={selectedPlan} onBack={() => setSelectedPlan(null)} />;
  }

  const now = Date.now() * 1_000_000; // Convert to nanoseconds
  const trialActive = subscriptionState.trialActive && (now - Number(subscriptionState.trialStart) < 172_800_000_000_000);
  const trialTimeLeft = trialActive
    ? Math.max(0, 172_800_000_000_000 - (now - Number(subscriptionState.trialStart)))
    : 0;
  const trialHoursLeft = Math.floor(trialTimeLeft / (3_600_000_000_000));

  const hasPaidPlan = subscriptionState.plan && subscriptionState.paidStart;
  const paidExpired = hasPaidPlan && (now - Number(subscriptionState.paidStart) >= 2_678_400_000_000_000);

  const getPlanName = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.basic:
        return 'Basic';
      case SubscriptionPlan.pro:
        return 'Pro';
      case SubscriptionPlan.premium:
        return 'Premium';
      default:
        return 'Unknown';
    }
  };

  const plans = [
    {
      id: SubscriptionPlan.basic,
      name: 'Basic',
      price: 299,
      features: ['Trade Journal', 'Basic Analytics', 'Trade History'],
      color: 'from-emerald-500 to-teal-600',
      recommended: false,
    },
    {
      id: SubscriptionPlan.pro,
      name: 'Pro',
      price: 799,
      features: ['Everything in Basic', 'Mistakes Tracking', 'AI Suggestions', 'Advanced Analytics'],
      color: 'from-amber-500 to-orange-600',
      recommended: true,
    },
    {
      id: SubscriptionPlan.premium,
      name: 'Premium',
      price: 999,
      features: ['Everything in Pro', 'Risk Calculator', 'Priority Support', 'Custom Reports'],
      color: 'from-purple-500 to-pink-600',
      recommended: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Trial Status */}
      {trialActive && (
        <Alert className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-emerald-900 dark:text-emerald-100">2-Day Free Trial Active</AlertTitle>
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            You have {trialHoursLeft} hours remaining in your free trial. Enjoy full access to all features!
            <div className="mt-2">
              <Button
                onClick={() => cancelTrial.mutate()}
                disabled={cancelTrial.isPending}
                variant="outline"
                size="sm"
                className="border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                {cancelTrial.isPending ? 'Cancelling...' : 'Cancel Trial'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Paid Plan Status */}
      {hasPaidPlan && !paidExpired && (
        <Alert className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-emerald-900 dark:text-emerald-100">Active Subscription</AlertTitle>
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            Your {subscriptionState.plan ? getPlanName(subscriptionState.plan) : 'subscription'} plan is active until{' '}
            {new Date(Number(subscriptionState.paidStart) / 1_000_000 + 31 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Expired Status */}
      {!trialActive && (!hasPaidPlan || paidExpired) && (
        <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">Subscription Expired</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Your subscription has expired. Choose a plan below to continue using the app.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            Select a subscription plan to continue using Yug Trade Journal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.recommended ? 'border-2 border-primary' : ''
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-amber-500 to-orange-600 border-0">
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">₹{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                      : ''
                  }`}
                  variant={plan.recommended ? 'default' : 'outline'}
                >
                  Select Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Admin Approval Notice */}
      <Alert>
        <AlertDescription>
          <strong>Note:</strong> After submitting your payment, an admin will review and approve your subscription. You will receive access once approved.
        </AlertDescription>
      </Alert>
    </div>
  );
}
