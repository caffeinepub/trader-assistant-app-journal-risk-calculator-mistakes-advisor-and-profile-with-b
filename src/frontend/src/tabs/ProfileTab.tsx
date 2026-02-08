import { useState } from 'react';
import { useGetCallerUserProfile, useSaveUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { User, Save, Shield, CreditCard, Mail } from 'lucide-react';
import AdminPanel from '../components/admin/AdminPanel';
import SubscriptionsView from '../components/subscriptions/SubscriptionsView';

type ProfileView = 'profile' | 'admin' | 'subscriptions';

export default function ProfileTab() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const saveProfile = useSaveUserProfile();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentView, setCurrentView] = useState<ProfileView>('profile');

  if (isLoading || isAdminLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No profile found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEdit = () => {
    setFullName(userProfile.fullName);
    setUsername(userProfile.username);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (fullName.trim() && username.trim()) {
      saveProfile.mutate(
        {
          fullName: fullName.trim(),
          username: username.trim(),
          dateJoined: userProfile.dateJoined,
          userId: userProfile.userId,
        },
        {
          onSuccess: () => setIsEditing(false),
        }
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFullName('');
    setUsername('');
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (currentView === 'admin' && isAdmin) {
    return (
      <>
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <Button onClick={() => setCurrentView('profile')} variant="ghost" size="sm">
            ← Back to Profile
          </Button>
        </div>
        <AdminPanel />
      </>
    );
  }

  if (currentView === 'subscriptions') {
    return (
      <>
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <Button onClick={() => setCurrentView('profile')} variant="ghost" size="sm">
            ← Back to Profile
          </Button>
        </div>
        <SubscriptionsView />
      </>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Profile Information
          </CardTitle>
          <CardDescription>Manage your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saveProfile.isPending || !fullName.trim() || !username.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={handleCancel} variant="outline" disabled={saveProfile.isPending}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <p className="text-lg font-medium">{userProfile.fullName}</p>
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <p className="text-lg font-medium">@{userProfile.username}</p>
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <p className="text-lg font-medium">{formatDate(userProfile.dateJoined)}</p>
              </div>
              <Button onClick={handleEdit} variant="outline">
                Edit Profile
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Subscriptions Section */}
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setCurrentView('subscriptions')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Subscriptions
          </CardTitle>
          <CardDescription>Manage your subscription plan and features</CardDescription>
        </CardHeader>
      </Card>

      {/* Admin Section - Only visible to admin */}
      {isAdmin && (
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setCurrentView('admin')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-500" />
              Admin Panel
            </CardTitle>
            <CardDescription>Manage users, subscriptions, and payment settings</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Customer Support Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-blue-500" />
            Customer Support
          </CardTitle>
          <CardDescription>Need help? Contact our support team</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="mailto:yug553496@gmail.com"
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            yug553496@gmail.com
          </a>
        </CardContent>
      </Card>

      <footer className="text-center text-sm text-muted-foreground py-4">
        © 2026. Built with ❤️ using{' '}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
