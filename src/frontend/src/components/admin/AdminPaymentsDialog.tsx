import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, CheckCircle, XCircle } from 'lucide-react';
import {
  useAdminGetPendingPayments,
  useAdminReviewAndApprovePayment,
  useAdminRejectPayment,
} from '../../hooks/useQueries';
import { SubscriptionPlan } from '../../backend';

interface AdminPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminPaymentsDialog({ open, onOpenChange }: AdminPaymentsDialogProps) {
  const { data: pendingPayments, isLoading } = useAdminGetPendingPayments();
  const approvePayment = useAdminReviewAndApprovePayment();
  const rejectPayment = useAdminRejectPayment();

  const [rejectingUser, setRejectingUser] = useState<string | null>(null);

  const getPlanLabel = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.basic:
        return 'Basic (₹299)';
      case SubscriptionPlan.pro:
        return 'Pro (₹799)';
      case SubscriptionPlan.premium:
        return 'Premium (₹999)';
      default:
        return 'Unknown';
    }
  };

  const handleApprove = async (userPrincipal: string) => {
    if (confirm('Are you sure you want to approve this payment and activate the subscription?')) {
      try {
        const principal = { __principal__: userPrincipal } as any;
        await approvePayment.mutateAsync(principal);
      } catch (error) {
        console.error('Failed to approve payment:', error);
      }
    }
  };

  const handleReject = async (userPrincipal: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason !== null) {
      try {
        const principal = { __principal__: userPrincipal } as any;
        await rejectPayment.mutateAsync({ user: principal, reason: reason || 'No reason provided' });
        setRejectingUser(null);
      } catch (error) {
        console.error('Failed to reject payment:', error);
      }
    }
  };

  const handleDownloadProof = (paymentProof: Uint8Array, transactionId: string) => {
    const blob = new Blob([paymentProof as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-proof-${transactionId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Pending Payments
          </DialogTitle>
          <DialogDescription className="break-words">
            View pending payment submissions, download payment proofs, approve or reject user subscriptions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground mt-4">Loading pending payments...</p>
            </div>
          ) : pendingPayments && pendingPayments.length > 0 ? (
            <div className="space-y-4">
              {pendingPayments.map(([principal, payment]) => {
                const submittedDate = new Date(Number(payment.submittedAt) / 1_000_000);
                
                return (
                  <Card key={principal.toString()}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="shrink-0">{getPlanLabel(payment.plan)}</Badge>
                            <span className="text-sm text-muted-foreground">
                              ₹{Number(payment.finalAmount)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">Transaction ID:</span>{' '}
                              <span className="break-all">{payment.transactionId}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">User:</span>{' '}
                              <span className="break-all font-mono text-xs">{principal.toString()}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {submittedDate.toLocaleString()}
                            </p>
                            {payment.couponCode && (
                              <p className="text-sm">
                                <span className="font-medium">Coupon:</span> {payment.couponCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleDownloadProof(payment.paymentProof, payment.transactionId)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Proof
                        </Button>
                        <Button
                          onClick={() => handleApprove(principal.toString())}
                          disabled={approvePayment.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {approvePayment.isPending ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => handleReject(principal.toString())}
                          disabled={rejectPayment.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {rejectPayment.isPending ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending payments</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
