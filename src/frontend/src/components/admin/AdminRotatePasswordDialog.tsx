import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useRotateAdminPassword, useIsPermanentAdmin } from '../../hooks/useQueries';

interface AdminRotatePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminRotatePasswordDialog({ open, onOpenChange }: AdminRotatePasswordDialogProps) {
  const rotatePassword = useRotateAdminPassword();
  const { data: isPermanentAdmin, isLoading: checkingPermission } = useIsPermanentAdmin();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    setError('');
    setSuccess(false);

    // Validation: empty password
    if (!newPassword) {
      setError('Password cannot be empty');
      return;
    }

    // Validation: minimum length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Validation: passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await rotatePassword.mutateAsync(newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      // Backend will trap if not a permanent admin
      const errorMessage = err?.message || 'Failed to update password';
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('permanent admin')) {
        setError('Only permanent admins can change the unlock password');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onOpenChange(false);
  };

  // Show permission error if not a permanent admin
  const showPermissionError = !checkingPermission && isPermanentAdmin === false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Key className="w-5 h-5 shrink-0 text-primary" />
            <span className="break-words">Set/Update Admin Password</span>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed break-words">
            Set or update the admin unlock password for temporary admin access. Only permanent admins can perform this action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              <AlertDescription className="break-words leading-relaxed text-green-600 dark:text-green-400">
                Password updated successfully
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <AlertDescription className="break-words leading-relaxed">{error}</AlertDescription>
            </Alert>
          )}

          {showPermissionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <AlertDescription className="break-words leading-relaxed">
                Only permanent admins can change the unlock password
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
              disabled={showPermissionError || rotatePassword.isPending}
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
              disabled={showPermissionError || rotatePassword.isPending}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleUpdate}
              disabled={showPermissionError || rotatePassword.isPending || !newPassword || !confirmPassword}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {rotatePassword.isPending ? 'Updating...' : 'Update Password'}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={rotatePassword.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
