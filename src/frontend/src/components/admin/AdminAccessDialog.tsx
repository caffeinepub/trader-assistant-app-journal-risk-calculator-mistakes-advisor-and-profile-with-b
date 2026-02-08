import { useState } from 'react';
import { useUnlockAdmin } from '../../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertTriangle } from 'lucide-react';

interface AdminAccessDialogProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminAccessDialog({ open, onSuccess, onCancel }: AdminAccessDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const unlockMutation = useUnlockAdmin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    try {
      const success = await unlockMutation.mutateAsync(password);
      if (success) {
        setPassword('');
        onSuccess();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err: any) {
      // Never expose the password in error messages
      setError('Incorrect password. Please try again.');
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-center">Admin Access Required</DialogTitle>
          <DialogDescription className="text-center break-words">
            Enter the admin password to access the admin panel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={unlockMutation.isPending}
              autoFocus
              className="text-center"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="break-words">{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={unlockMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={unlockMutation.isPending || !password.trim()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {unlockMutation.isPending ? 'Verifying...' : 'Unlock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
