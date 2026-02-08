import { useState } from 'react';
import { useGetAllUserData } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, AlertTriangle, CreditCard, RefreshCw, Search, DollarSign, Tag } from 'lucide-react';
import { SubscriptionPlan, UserProfile, TradeEntry, MistakeEntry, SubscriptionState } from '../../backend';
import { formatSequentialUserId, parseSequentialUserId } from '../../lib/userId';
import AdminUserDetailDialog from './AdminUserDetailDialog';
import AdminPaymentMethodsDialog from './AdminPaymentMethodsDialog';
import AdminDiscountsDialog from './AdminDiscountsDialog';
import type { Principal } from '@icp-sdk/core/principal';

export default function AdminPanel() {
  const { data: allUserData, isLoading, error, refetch, isFetching } = useGetAllUserData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<{
    principal: Principal;
    profile: UserProfile;
    trades: TradeEntry[];
    mistakes: MistakeEntry[];
    subscriptionState: SubscriptionState | null;
  } | null>(null);
  const [showPaymentMethodsDialog, setShowPaymentMethodsDialog] = useState(false);
  const [showDiscountsDialog, setShowDiscountsDialog] = useState(false);

  const handleLoadData = () => {
    refetch();
  };

  const handleUserClick = (
    principal: Principal,
    profile: UserProfile,
    trades: TradeEntry[],
    mistakes: MistakeEntry[],
    subscriptionState: SubscriptionState | null
  ) => {
    setSelectedUser({ principal, profile, trades, mistakes, subscriptionState });
  };

  const filteredUserData = allUserData?.filter(([_principal, profile]) => {
    if (!searchQuery.trim()) return true;
    
    const parsedId = parseSequentialUserId(searchQuery.trim());
    if (parsedId !== null) {
      return Number(profile.userId) === parsedId;
    }
    
    return false;
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view admin data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!allUserData || allUserData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Admin Panel
            </CardTitle>
            <CardDescription>View and manage all user data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center py-8">
              Click the button below to load all user data.
            </p>
            <Button
              onClick={handleLoadData}
              disabled={isLoading || isFetching}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Loading...' : 'Load All User Data'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Admin Panel
              </CardTitle>
              <CardDescription>Viewing data for {allUserData.length} registered users</CardDescription>
            </div>
            <Button
              onClick={handleLoadData}
              disabled={isFetching}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowPaymentMethodsDialog(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-sm">Manage payment options</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowDiscountsDialog(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="w-4 h-4 text-orange-500" />
                  Discounts
                </CardTitle>
                <CardDescription className="text-sm">Manage discount codes</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Separator />

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="user-search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search by User ID
            </Label>
            <Input
              id="user-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter User ID (e.g., #000001 or 1)"
              className="max-w-md"
            />
          </div>

          <Separator />

          {/* User List */}
          {filteredUserData && filteredUserData.length > 0 ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {filteredUserData.map(([principal, profile, trades, mistakes, subscriptionState], index) => (
                  <div key={principal.toString()}>
                    <Card 
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleUserClick(principal, profile, trades, mistakes, subscriptionState)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{profile.fullName}</CardTitle>
                            <CardDescription>@{profile.username}</CardDescription>
                            <p className="text-sm font-mono text-blue-600 font-semibold">
                              {formatSequentialUserId(profile.userId)}
                            </p>
                          </div>
                          {getPlanBadge(subscriptionState?.plan ?? null)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Principal ID</p>
                            <p className="text-xs font-mono break-all">{principal.toString()}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Member Since</p>
                            <p className="text-sm font-medium">{formatDate(profile.dateJoined)}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-2xl font-bold">{trades.length}</p>
                              <p className="text-xs text-muted-foreground">Trades</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-2xl font-bold">{mistakes.length}</p>
                              <p className="text-xs text-muted-foreground">Mistakes</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-xs font-medium">
                                {getSubscriptionStatus(subscriptionState)}
                              </p>
                              <p className="text-xs text-muted-foreground">Status</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {index < filteredUserData.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found matching your search.</p>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="link"
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      {selectedUser && (
        <AdminUserDetailDialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          principal={selectedUser.principal}
          profile={selectedUser.profile}
          trades={selectedUser.trades}
          mistakes={selectedUser.mistakes}
          subscriptionState={selectedUser.subscriptionState}
        />
      )}

      {/* Payment Methods Dialog */}
      <AdminPaymentMethodsDialog
        open={showPaymentMethodsDialog}
        onOpenChange={setShowPaymentMethodsDialog}
      />

      {/* Discounts Dialog */}
      <AdminDiscountsDialog
        open={showDiscountsDialog}
        onOpenChange={setShowDiscountsDialog}
      />
    </div>
  );
}
