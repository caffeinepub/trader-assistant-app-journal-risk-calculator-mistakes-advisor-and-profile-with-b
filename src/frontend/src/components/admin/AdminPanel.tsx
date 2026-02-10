import { useState } from 'react';
import { useAdminGetAllUserData } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, Tag, QrCode, Key } from 'lucide-react';
import AdminUserDetailDialog from './AdminUserDetailDialog';
import AdminPaymentsDialog from './AdminPaymentsDialog';
import AdminPaymentMethodsDialog from './AdminPaymentMethodsDialog';
import AdminDiscountsDialog from './AdminDiscountsDialog';
import AdminPaymentQRCodeDialog from './AdminPaymentQRCodeDialog';
import AdminRotatePasswordDialog from './AdminRotatePasswordDialog';
import { formatSequentialUserId } from '../../lib/userId';
import type { Principal } from '@icp-sdk/core/principal';
import { UserProfile, TradeEntry, MistakeEntry, SubscriptionState } from '../../backend';

type View = 'landing' | 'users';

export default function AdminPanel() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [showPaymentsDialog, setShowPaymentsDialog] = useState(false);
  const [showPaymentMethodsDialog, setShowPaymentMethodsDialog] = useState(false);
  const [showDiscountsDialog, setShowDiscountsDialog] = useState(false);
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
  const [showRotatePasswordDialog, setShowRotatePasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    principal: Principal;
    profile: UserProfile;
    trades: TradeEntry[];
    mistakes: MistakeEntry[];
    subscriptionState: SubscriptionState | null;
  } | null>(null);

  const { data: allUserData, isLoading } = useAdminGetAllUserData();

  const handleUserClick = (
    principal: Principal,
    profile: UserProfile,
    trades: TradeEntry[],
    mistakes: MistakeEntry[],
    subscriptionState: SubscriptionState | null
  ) => {
    setSelectedUser({ principal, profile, trades, mistakes, subscriptionState });
  };

  const handleCloseUserDialog = () => {
    setSelectedUser(null);
  };

  const handleCardClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  if (currentView === 'landing') {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground break-words">
            Access user subscription status, trades, and mistakes. Manage user subscriptions and remove users.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={(e) => handleCardClick(e, () => setCurrentView('users'))}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 shrink-0 text-primary" />
                <span className="break-words">All Users</span>
              </CardTitle>
              <CardDescription className="break-words">
                View and manage all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{allUserData?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total users</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={(e) => handleCardClick(e, () => setShowPaymentsDialog(true))}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 shrink-0 text-primary" />
                <span className="break-words">Payments</span>
              </CardTitle>
              <CardDescription className="break-words">
                View pending payment submissions, download payment proofs, approve or reject user subscriptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={(e) => handleCardClick(e, () => setShowPaymentMethodsDialog(true))}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 shrink-0 text-primary" />
                <span className="break-words">Payment Methods</span>
              </CardTitle>
              <CardDescription className="break-words">
                Create, edit, enable/disable, and delete payment methods
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={(e) => handleCardClick(e, () => setShowDiscountsDialog(true))}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="w-5 h-5 shrink-0 text-primary" />
                <span className="break-words">Discounts</span>
              </CardTitle>
              <CardDescription className="break-words">
                Create, edit, enable/disable, and delete discount codes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={(e) => handleCardClick(e, () => setShowQRCodeDialog(true))}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="w-5 h-5 shrink-0 text-primary" />
                <span className="break-words">Payment QR Code</span>
              </CardTitle>
              <CardDescription className="break-words">
                Upload, replace, or remove the payment QR code shown to users during subscription payment
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={(e) => handleCardClick(e, () => setShowRotatePasswordDialog(true))}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5 shrink-0 text-primary" />
                <span className="break-words">Set/Update Admin Password</span>
              </CardTitle>
              <CardDescription className="break-words">
                Set or update the admin unlock password for temporary admin access
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <AdminPaymentsDialog open={showPaymentsDialog} onOpenChange={setShowPaymentsDialog} />
        <AdminPaymentMethodsDialog open={showPaymentMethodsDialog} onOpenChange={setShowPaymentMethodsDialog} />
        <AdminDiscountsDialog open={showDiscountsDialog} onOpenChange={setShowDiscountsDialog} />
        <AdminPaymentQRCodeDialog open={showQRCodeDialog} onOpenChange={setShowQRCodeDialog} />
        <AdminRotatePasswordDialog open={showRotatePasswordDialog} onOpenChange={setShowRotatePasswordDialog} />
      </div>
    );
  }

  // Users view
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-3xl font-bold break-words">All Users</h1>
          <p className="text-muted-foreground break-words">
            View and manage all registered users
          </p>
        </div>
        <Button variant="outline" onClick={() => setCurrentView('landing')} className="shrink-0">
          Back to Dashboard
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUserData?.map(([principal, profile, trades, mistakes, subscriptionState]) => (
            <Card
              key={principal.toString()}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleUserClick(principal, profile, trades, mistakes, subscriptionState)}
            >
              <CardHeader>
                <CardTitle className="text-lg break-words">{profile.fullName}</CardTitle>
                <CardDescription className="break-words">@{profile.username}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User ID</span>
                  <span className="text-sm font-medium">{formatSequentialUserId(profile.userId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm font-medium">
                    {new Date(Number(profile.dateJoined) / 1_000_000).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedUser && (
        <AdminUserDetailDialog
          open={!!selectedUser}
          onOpenChange={(open) => {
            if (!open) handleCloseUserDialog();
          }}
          principal={selectedUser.principal}
          profile={selectedUser.profile}
          trades={selectedUser.trades}
          mistakes={selectedUser.mistakes}
          subscriptionState={selectedUser.subscriptionState}
        />
      )}
    </div>
  );
}
