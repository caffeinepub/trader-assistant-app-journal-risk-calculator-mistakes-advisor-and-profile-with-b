import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, QrCode } from 'lucide-react';
import { useSubmitPayment, useGetActiveDiscounts, useGetPaymentQRCode } from '../../hooks/useQueries';
import { SubscriptionPlan } from '../../backend';

interface PaymentViewProps {
  plan: SubscriptionPlan;
  onBack: () => void;
}

export default function PaymentView({ plan, onBack }: PaymentViewProps) {
  const submitPayment = useSubmitPayment();
  const { data: activeDiscounts } = useGetActiveDiscounts();
  const { data: paymentQRCode } = useGetPaymentQRCode();

  const [transactionId, setTransactionId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const planPrices = {
    [SubscriptionPlan.basic]: 299,
    [SubscriptionPlan.pro]: 799,
    [SubscriptionPlan.premium]: 999,
  };

  const basePrice = planPrices[plan];
  const [finalAmount, setFinalAmount] = useState(basePrice);

  useEffect(() => {
    let amount = basePrice;

    if (couponCode && activeDiscounts) {
      const discount = activeDiscounts.find((d) => d.code === couponCode.toUpperCase());
      if (discount) {
        amount = Math.round(basePrice * (1 - discount.percentage / 100));
      }
    }

    setFinalAmount(amount);
  }, [couponCode, basePrice, activeDiscounts]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('File size must be less than 8MB');
      return;
    }

    setPaymentProofFile(file);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    if (!transactionId) {
      setError('Please enter transaction ID');
      return;
    }

    if (!paymentProofFile) {
      setError('Please upload payment proof (PDF)');
      return;
    }

    try {
      const arrayBuffer = await paymentProofFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await submitPayment.mutateAsync({
        plan,
        couponCode: couponCode || null,
        pointsRedeemed: BigInt(0),
        finalAmount: BigInt(finalAmount),
        transactionId,
        fileType: paymentProofFile.type,
        fileSize: BigInt(paymentProofFile.size),
        paymentProof: uint8Array,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment. Please try again.');
    }
  };

  const getPlanName = () => {
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

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Payment Submitted!</h2>
              <p className="text-muted-foreground">
                Your payment has been submitted successfully. An admin will review and approve your subscription shortly.
              </p>
            </div>
            <Button onClick={onBack} className="bg-primary hover:bg-primary/90">
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Plans
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
          <CardDescription>
            Submit your payment details for {getPlanName()} Plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment QR Code */}
          {paymentQRCode ? (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Payment QR Code
              </Label>
              <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                <img
                  src={paymentQRCode.getDirectURL()}
                  alt="Payment QR Code"
                  className="max-w-full max-h-80 w-auto h-auto object-contain rounded-lg border shadow-sm"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to make the payment
              </p>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Payment QR code not configured. Please contact admin for payment details.
              </AlertDescription>
            </Alert>
          )}

          {/* Price Summary */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span>₹{basePrice}</span>
            </div>
            {couponCode && activeDiscounts?.find((d) => d.code === couponCode.toUpperCase()) && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount ({couponCode}):</span>
                <span>-₹{basePrice - finalAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>₹{finalAmount}</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Coupon Code */}
          <div className="space-y-2">
            <Label htmlFor="coupon">Coupon Code (Optional)</Label>
            <Input
              id="coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
            />
          </div>

          {/* Transaction ID */}
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID *</Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID from payment"
            />
          </div>

          {/* Payment Proof Upload */}
          <div className="space-y-2">
            <Label htmlFor="paymentProof">Payment Proof (PDF) *</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <input
                  id="paymentProof"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {paymentProofFile ? paymentProofFile.name : 'Select PDF File'}
                  </span>
                </Button>
              </label>
            </div>
            {paymentProofFile && (
              <p className="text-sm text-muted-foreground">
                {(paymentProofFile.size / 1024).toFixed(2)} KB
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitPayment.isPending || !transactionId || !paymentProofFile}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {submitPayment.isPending ? 'Submitting...' : 'Submit Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
