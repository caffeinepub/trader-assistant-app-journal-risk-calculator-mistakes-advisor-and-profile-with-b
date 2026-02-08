import { useState } from 'react';
import { useGetCallerUserProfile, useSaveUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useTheme } from '../hooks/useTheme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Calendar, Hash, Shield, Copy, Check, Palette, Sun, Moon } from 'lucide-react';
import SubscriptionsView from '../components/subscriptions/SubscriptionsView';
import { useEffect } from 'react';

export default function ProfileTab() {
  const { actor } = useActor();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveUserProfile();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  // Check if user is a permanent admin
  useEffect(() => {
    async function checkAdmin() {
      if (!actor) return;
      try {
        const result = await actor.isCallerAdmin();
        setIsAdmin(result);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setIsAdminLoading(false);
      }
    }
    checkAdmin();
  }, [actor]);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName);
      setUsername(userProfile.username);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;
    
    await saveProfile.mutateAsync({
      ...userProfile,
      fullName,
      username,
    });
  };

  const handleCopyPrincipal = async () => {
    if (!actor) return;
    try {
      const identity = await actor.getCallerUserRole();
      // Get principal from identity
      const principal = (actor as any).getPrincipal?.()?.toString() || 'N/A';
      await navigator.clipboard.writeText(principal);
      setCopiedPrincipal(true);
      setTimeout(() => setCopiedPrincipal(false), 2000);
    } catch (error) {
      console.error('Failed to copy principal:', error);
    }
  };

  if (showSubscriptions) {
    return <SubscriptionsView />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            No profile found. Please complete the profile setup.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const joinDate = new Date(Number(userProfile.dateJoined) / 1_000_000);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account information and subscription</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saveProfile.isPending || !fullName || !username}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {saveProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex items-center justify-center gap-2"
              >
                <Sun className="w-4 h-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex items-center justify-center gap-2"
              >
                <Moon className="w-4 h-4" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Hash className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">User ID</p>
              <p className="text-sm text-muted-foreground">
                #{String(userProfile.userId).padStart(6, '0')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">
                {joinDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Access Info */}
      {!isAdminLoading && !isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Access
            </CardTitle>
            <CardDescription>Information about admin privileges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-3">
                <p className="text-sm leading-relaxed">
                  You do not have permanent admin access. Admin access is granted by Principal ID, not by email or username.
                </p>
                <p className="text-sm leading-relaxed">
                  If you need admin access, please contact the system administrator and provide your Principal ID below.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPrincipal}
                    className="flex items-center gap-2"
                  >
                    {copiedPrincipal ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Principal ID
                      </>
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowSubscriptions(true)}
            className="w-full bg-primary hover:bg-primary/90"
          >
            View Subscription Plans
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
