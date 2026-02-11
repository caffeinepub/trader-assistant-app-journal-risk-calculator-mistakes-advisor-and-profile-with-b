import { useState } from 'react';
import { useGetCallerUserProfile, useGetSubscriptionState } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Calendar, Hash, Crown, Moon, Sun, AlertCircle } from 'lucide-react';
import SubscriptionsView from '../components/subscriptions/SubscriptionsView';
import { useTheme } from '../hooks/useTheme';

export default function ProfileTab() {
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useGetCallerUserProfile();
  const { data: subscriptionState } = useGetSubscriptionState();
  const { identity } = useInternetIdentity();
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const { theme, setTheme } = useTheme();

  if (showSubscriptions) {
    return <SubscriptionsView />;
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load profile. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No profile found. Please complete the profile setup.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const now = Date.now() * 1_000_000;
  const trialActive = subscriptionState?.trialActive && (now - Number(subscriptionState.trialStart) < 172_800_000_000_000);
  const hasPaidPlan = subscriptionState?.plan && subscriptionState?.paidStart;
  const paidExpired = hasPaidPlan && (now - Number(subscriptionState.paidStart) >= 2_678_400_000_000_000);

  const getPlanName = () => {
    if (trialActive) return 'Free Trial';
    if (hasPaidPlan && !paidExpired) {
      switch (subscriptionState?.plan) {
        case 'basic':
          return 'Basic';
        case 'pro':
          return 'Pro';
        case 'premium':
          return 'Premium';
        default:
          return 'Unknown';
      }
    }
    return 'No Active Plan';
  };

  const getPlanBadgeVariant = () => {
    if (trialActive) return 'default';
    if (hasPaidPlan && !paidExpired) return 'default';
    return 'outline';
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-muted-foreground">Manage your account and subscription</p>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{userProfile.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">@{userProfile.username}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Hash className="w-4 h-4" />
                User ID
              </p>
              <p className="font-medium">#{String(userProfile.userId).padStart(6, '0')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Member Since
              </p>
              <p className="font-medium">
                {new Date(Number(userProfile.dateJoined) / 1_000_000).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Subscription
          </CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getPlanBadgeVariant()}>{getPlanName()}</Badge>
              </div>
            </div>
            <Button onClick={() => setShowSubscriptions(true)}>
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Choose between light and dark mode
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="w-4 h-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Principal ID (for debugging) */}
      {identity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Principal ID</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs break-all bg-muted p-2 rounded block">
              {identity.getPrincipal().toString()}
            </code>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
