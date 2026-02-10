import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import {
  useAdminGetPendingPayments,
  useAdminApprovePayment,
  useAdminRejectPayment,
} from '../../hooks/useQueries';
import { SubscriptionPlan } from '../../backend';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

interface AdminPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.basic]: 'Basic',
  [SubscriptionPlan.pro]: 'Pro',
  [SubscriptionPlan.premium]: 'Premium',
};

export default function AdminPaymentsDialog({ open, onOpenChange }: AdminPaymentsDialogProps) {
  const { data: pendingPayments, isLoading } = useAdminGetPendingPayments();
  const approvePayment = useAdminApprovePayment();
  const rejectPayment = useAdminRejectPayment();

  const handleApprove = async (userPrincipal: Principal) => {
    try {
      await approvePayment.mutateAsync(userPrincipal);
      toast.success('Payment approved successfully');
    } catch (error: any) {
      console.error('Approve payment error:', error);
      toast.error(error.message || 'Failed to approve payment');
    }
  };

  const handleReject = async (userPrincipal: Principal) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;

    try {
      await rejectPayment.mutateAsync({ user: userPrincipal, reason: reason || 'No reason provided' });
      toast.success('Payment rejected');
    } catch (error: any) {
      console.error('Reject payment error:', error);
      toast.error(error.message || 'Failed to reject payment');
    }
  };

  const handleViewProof = (payment: any) => {
    try {
      const uint8Array = new Uint8Array(payment.paymentProof);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error viewing proof:', error);
      toast.error('Failed to open payment proof');
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Pending Payment Approvals
          </DialogTitle>
          <DialogDescription className="break-words">
            Review and approve or reject user payment submissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading pending payments...</p>
          ) : pendingPayments && pendingPayments.length > 0 ? (
            pendingPayments.map(([principal, payment]) => (
              <Card key={principal.toString()}>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Payment Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">User Principal</p>
                          <p className="text-sm font-mono break-all">{principal.toString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Plan</p>
                          <Badge variant="outline">{PLAN_NAMES[payment.plan]}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="text-sm font-semibold">₹{Number(payment.finalAmount)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Transaction ID</p>
                          <p className="text-sm font-mono break-all">{payment.transactionId}</p>
                        </div>
                        {payment.couponCode && (
                          <div>
                            <p className="text-xs text-muted-foreground">Coupon Code</p>
                            <p className="text-sm font-mono break-all">{payment.couponCode}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                          <p className="text-sm">{formatDate(payment.submittedAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProof(payment);
                        }}
                        className="flex-1"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Proof
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(principal);
                        }}
                        disabled={approvePayment.isPending}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(principal);
                        }}
                        disabled={rejectPayment.isPending}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No pending payments to review</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
