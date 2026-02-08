import { useState } from 'react';
import { useCreateUserProfile } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles } from 'lucide-react';
import { APP_NAME } from '../../lib/branding';

export default function ProfileSetupDialog() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const createProfile = useCreateUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && username.trim()) {
      createProfile.mutate({ fullName: fullName.trim(), username: username.trim() });
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to {APP_NAME}</DialogTitle>
          <DialogDescription>
            Please complete your profile to get started with your 2-day free trial.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-green-50 border-green-200">
          <Sparkles className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">
            You'll get instant access to all features for 2 days - no payment required!
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={createProfile.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={createProfile.isPending}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={createProfile.isPending || !fullName.trim() || !username.trim()}
          >
            {createProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free Trial
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
