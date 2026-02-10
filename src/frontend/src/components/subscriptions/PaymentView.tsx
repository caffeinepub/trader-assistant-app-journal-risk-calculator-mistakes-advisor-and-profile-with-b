import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Upload, X } from 'lucide-react';
import { SubscriptionPlan } from '../../backend';
import { useSubmitPayment, useGetPaymentQRCode } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface PaymentViewProps {
  plan: SubscriptionPlan;
  onBack: () => void;
}

const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.basic]: 299,
  [SubscriptionPlan.pro]: 799,
  [SubscriptionPlan.premium]: 999,
};

const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.basic]: 'Basic',
  [SubscriptionPlan.pro]: 'Pro',
  [SubscriptionPlan.premium]: 'Premium',
};

export default function PaymentView({ plan, onBack }: PaymentViewProps) {
  const [couponCode, setCouponCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitPayment = useSubmitPayment();
  const { data: qrCodeBlob } = useGetPaymentQRCode();

  const basePrice = PLAN_PRICES[plan];
  const finalAmount = basePrice;

  useEffect(() => {
    setIsSubmitted(false);
  }, [plan]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error('File size must be less than 8MB');
        return;
      }
      setPaymentFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter a transaction ID');
      return;
    }

    if (!paymentFile) {
      toast.error('Please upload payment proof (PDF)');
      return;
    }

    try {
      const fileBuffer = await paymentFile.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);

      await submitPayment.mutateAsync({
        plan,
        couponCode: couponCode.trim() || null,
        pointsRedeemed: BigInt(0),
        finalAmount: BigInt(finalAmount),
        transactionId: transactionId.trim(),
        fileType: paymentFile.type,
        fileSize: BigInt(paymentFile.size),
        paymentProof: fileBytes,
      });

      setIsSubmitted(true);
      toast.success('Payment submitted successfully!');
    } catch (error: any) {
      console.error('Payment submission error:', error);
      toast.error(error.message || 'Failed to submit payment');
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-primary/20">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Payment Submitted!</h2>
                <p className="text-muted-foreground max-w-md break-words">
                  Your payment has been submitted for review. An admin will verify and approve your subscription within
                  24-48 hours.
                </p>
              </div>
              <Button onClick={onBack} variant="outline" className="mt-4">
                Back to Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Back to Plans
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>Payment QR Code</CardTitle>
            <CardDescription className="break-words">Scan to make payment</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            {qrCodeBlob ? (
              <img
                src={qrCodeBlob.getDirectURL()}
                alt="Payment QR Code"
                className="w-full max-w-sm rounded-lg border"
              />
            ) : (
              <div className="w-full max-w-sm aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-center px-4 break-words">
                  QR code not available. Please contact admin.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Payment Proof</CardTitle>
            <CardDescription className="break-words">
              Upload your payment proof and transaction details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Selected Plan:</span>
                <Badge variant="outline">{PLAN_NAMES[plan]}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-lg font-bold">₹{finalAmount}</span>
              </div>
            </div>

            {/* Coupon Code (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="coupon">Coupon Code (Optional)</Label>
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                disabled
              />
              <p className="text-xs text-muted-foreground break-words">Coupon validation coming soon</p>
            </div>

            {/* Transaction ID */}
            <div className="space-y-2">
              <Label htmlFor="transactionId">
                Transaction ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
                required
              />
            </div>

            {/* Payment Proof Upload */}
            <div className="space-y-2">
              <Label htmlFor="paymentProof">
                Payment Proof (PDF) <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                <Input
                  id="paymentProof"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  required
                />
                {paymentFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{paymentFile.name}</span>
                    <button
                      onClick={() => setPaymentFile(null)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground break-words">
                Upload a PDF screenshot or receipt of your payment (max 8MB)
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!transactionId.trim() || !paymentFile || submitPayment.isPending}
              className="w-full"
            >
              {submitPayment.isPending ? 'Submitting...' : 'Submit Payment'}
            </Button>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-foreground/90 break-words">
                After submission, an admin will review and approve your payment within 24-48 hours. You'll receive
                access to your selected plan once approved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
