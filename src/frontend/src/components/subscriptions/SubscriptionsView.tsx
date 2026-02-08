import { useState } from 'react';
import { useGetSubscriptionState, useSelectSubscriptionPlan, useCancelTrial } from '../../hooks/useQueries';
import { useEntitlement } from '../../hooks/useEntitlement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, CreditCard, Sparkles, Clock, AlertCircle, XCircle } from 'lucide-react';
import { SubscriptionPlan } from '../../backend';
import PaymentView from './PaymentView';

export default function SubscriptionsView() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { data: subscriptionState } = useGetSubscriptionState();
  const entitlement = useEntitlement();
  const selectPlan = useSelectSubscriptionPlan();
  const cancelTrial = useCancelTrial();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    selectPlan.mutate(plan, {
      onSuccess: () => {
        setSelectedPlan(plan);
      },
    });
  };

  const handleBackToPlans = () => {
    setSelectedPlan(null);
  };

  const handleCancelTrial = () => {
    cancelTrial.mutate(undefined, {
      onSuccess: () => {
        setShowCancelDialog(false);
      },
    });
  };

  if (selectedPlan) {
    return <PaymentView plan={selectedPlan} onBack={handleBackToPlans} />;
  }

  const plans = [
    {
      name: 'Basic Plan',
      price: 299,
      plan: SubscriptionPlan.basic,
      features: ['Journal Your Trades', 'Track Performance', 'View Analytics'],
      color: 'bg-emerald-50 border-emerald-200',
      badge: 'Basic',
      validity: '31 days',
    },
    {
      name: 'Pro Plan',
      price: 799,
      plan: SubscriptionPlan.pro,
      features: ['Journal Your Trades', 'Lot Size Calculator', 'Risk Management Tools', 'Advanced Analytics'],
      color: 'bg-amber-50 border-amber-200',
      badge: 'Pro',
      popular: true,
      validity: '31 days',
    },
    {
      name: 'Premium Plan',
      price: 999,
      plan: SubscriptionPlan.premium,
      features: [
        'Journal Your Trades',
        'Lot Size Calculator',
        'Mistakes Tracker',
        'AI-Powered Suggestions',
        'Full Analytics Suite',
      ],
      color: 'bg-gradient-to-br from-emerald-50 to-amber-50 border-emerald-300',
      badge: 'Premium',
      validity: '31 days',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Current Plan Status */}
      <Card className={entitlement.isTrial ? 'border-green-500 bg-green-50/50' : entitlement.isExpired ? 'border-orange-500 bg-orange-50/50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Your Subscription
              </CardTitle>
              <CardDescription>Current plan and features</CardDescription>
            </div>
            {entitlement.isTrial && (
              <Badge className="bg-green-600">
                <Sparkles className="w-3 h-3 mr-1" />
                Trial Active
              </Badge>
            )}
            {entitlement.isExpired && (
              <Badge variant="destructive">
                <Clock className="w-3 h-3 mr-1" />
                Expired
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{entitlement.planName}</p>
              <p className="text-sm text-muted-foreground">
                {entitlement.isTrial 
                  ? 'All features unlocked for 2 days from profile creation' 
                  : entitlement.isExpired
                  ? 'Your trial has expired. Please select a plan to continue.'
                  : entitlement.isLoading 
                  ? 'Loading subscription status...' 
                  : 'Active subscription (31 days from purchase)'}
              </p>
            </div>
          </div>

          {entitlement.isTrial && (
            <>
              <Alert className="bg-green-50 border-green-200">
                <Sparkles className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  You're currently on a 2-day free trial with access to all features. Submit payment for admin approval to continue after trial.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowCancelDialog(true)}
                disabled={cancelTrial.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {cancelTrial.isPending ? 'Cancelling...' : 'Cancel Trial'}
              </Button>
            </>
          )}

          {entitlement.isExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your trial has expired. Please select a plan below and submit payment for admin approval.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Subscription Plans */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            {entitlement.isTrial 
              ? 'Submit payment anytime during your trial for admin approval' 
              : 'Select a plan and submit payment for admin approval'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((planOption) => (
            <Card
              key={planOption.plan}
              className={`relative ${planOption.color} border-2 transition-all hover:shadow-lg`}
            >
              {planOption.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-600">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{planOption.badge}</Badge>
                  <span className="text-xs text-muted-foreground">{planOption.validity}</span>
                </div>
                <CardTitle className="text-2xl mt-2">{planOption.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹{planOption.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {planOption.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleSelectPlan(planOption.plan)}
                  disabled={selectPlan.isPending}
                >
                  {selectPlan.isPending ? 'Selecting...' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cancel Trial Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Free Trial?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your 2-day free trial? You will immediately lose access to all features until you purchase a subscription plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelTrial.isPending}>Keep Trial</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTrial}
              disabled={cancelTrial.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelTrial.isPending ? 'Cancelling...' : 'Cancel Trial'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
