import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAdminRotatePassword, useIsPermanentAdmin } from '../../hooks/useQueries';

interface AdminRotatePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminRotatePasswordDialog({ open, onOpenChange }: AdminRotatePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const rotatePassword = useAdminRotatePassword();
  const { data: isPermanentAdmin, isLoading: checkingAdmin } = useIsPermanentAdmin();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!newPassword) {
      setError('Password cannot be empty');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await rotatePassword.mutateAsync(newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    }
  };

  if (checkingAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Checking permissions...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isPermanentAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Key className="w-5 h-5 shrink-0 text-destructive" />
              <span className="break-words">Access Denied</span>
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <AlertDescription className="break-words leading-relaxed">
              Only permanent admins can set or update the admin unlock password
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Key className="w-5 h-5 shrink-0 text-primary" />
            <span className="break-words">Set/Update Admin Password</span>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed break-words">
            Set or update the password used for temporary admin access (5-minute sessions)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {success && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200 break-words leading-relaxed">
                Password updated successfully! Closing...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <AlertDescription className="break-words leading-relaxed">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              disabled={rotatePassword.isPending || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={rotatePassword.isPending || success}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={rotatePassword.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rotatePassword.isPending || success}
              className="flex-1"
            >
              {rotatePassword.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
