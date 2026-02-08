import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, QrCode, Info } from 'lucide-react';
import { SubscriptionPlan } from '../../backend';

interface PaymentViewProps {
  plan: SubscriptionPlan;
  price: number;
  onBack: () => void;
}

const UPI_ID = '6398919018@fam';

export default function PaymentView({ plan, price, onBack }: PaymentViewProps) {
  const getPlanName = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.basic:
        return 'Basic Plan';
      case SubscriptionPlan.pro:
        return 'Pro Plan';
      case SubscriptionPlan.premium:
        return 'Premium Plan';
      default:
        return 'Plan';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Plans
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-500" />
            Complete Your Payment
          </CardTitle>
          <CardDescription>Scan the QR code to pay for your subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Selected Plan:</span>
              <span className="font-semibold">{getPlanName(plan)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="text-2xl font-bold text-blue-600">₹{price}</span>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Scan the QR code below using any UPI app to complete your payment. After payment, contact support with your transaction ID to activate your subscription.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <div className="relative">
              <img
                src="/assets/generated/payment-qr-updated.dim_800x1200.png"
                alt="Payment QR Code"
                className="w-full max-w-sm rounded-lg shadow-lg border-2 border-border"
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Payment ID: <span className="font-mono font-semibold">{UPI_ID}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              After completing the payment, please contact support at <a href="mailto:yug553496@gmail.com" className="text-blue-600 hover:underline">yug553496@gmail.com</a> with your transaction ID to activate your subscription.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
