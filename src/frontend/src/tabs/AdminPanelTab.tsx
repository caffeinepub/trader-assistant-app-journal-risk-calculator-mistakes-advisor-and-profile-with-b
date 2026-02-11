import { useState, useEffect } from 'react';
import { useActor } from '../hooks/useActor';
import { useIsLockedAdmin } from '../hooks/useQueries';
import AdminPanel from '../components/admin/AdminPanel';
import AdminAccessDialog from '../components/admin/AdminAccessDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AdminPanelTab() {
  const { actor } = useActor();
  const { data: isLockedAdmin, isLoading: checkingLock, refetch } = useIsLockedAdmin();
  const [isPermanentAdmin, setIsPermanentAdmin] = useState(false);
  const [checkingPermanent, setCheckingPermanent] = useState(true);
  const [showAccessDialog, setShowAccessDialog] = useState(false);

  useEffect(() => {
    const checkPermanentAdmin = async () => {
      if (!actor) return;
      try {
        const result = await actor.isCallerAdmin();
        setIsPermanentAdmin(result);
      } catch (error) {
        setIsPermanentAdmin(false);
      } finally {
        setCheckingPermanent(false);
      }
    };

    checkPermanentAdmin();
  }, [actor]);

  const isAuthorized = isPermanentAdmin || isLockedAdmin;

  useEffect(() => {
    if (!checkingLock && !checkingPermanent && !isAuthorized) {
      setShowAccessDialog(true);
    }
  }, [checkingLock, checkingPermanent, isAuthorized]);

  const handleAccessSuccess = () => {
    setShowAccessDialog(false);
    refetch();
  };

  const handleAccessCancel = () => {
    setShowAccessDialog(false);
  };

  if (checkingLock || checkingPermanent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Checking admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Admin access required. Please unlock admin panel to continue.
          </AlertDescription>
        </Alert>
        <AdminAccessDialog 
          open={showAccessDialog} 
          onSuccess={handleAccessSuccess}
          onCancel={handleAccessCancel}
        />
      </div>
    );
  }

  return <AdminPanel />;
}
