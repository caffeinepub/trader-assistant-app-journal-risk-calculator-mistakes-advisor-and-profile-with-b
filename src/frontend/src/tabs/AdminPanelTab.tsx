import { useEffect, useState } from 'react';
import { useIsLockedAdmin } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import AdminPanel from '../components/admin/AdminPanel';
import AdminAccessDialog from '../components/admin/AdminAccessDialog';

export default function AdminPanelTab() {
  const { actor } = useActor();
  const { data: isLockedAdmin, isLoading: isLockedLoading } = useIsLockedAdmin();
  const [showDialog, setShowDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

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

  // Check if user is authorized (either true admin or password-unlocked)
  const isAuthorized = isAdmin === true || isLockedAdmin === true;

  // Show dialog when not authorized and not loading
  useEffect(() => {
    if (!isAdminLoading && !isLockedLoading && !isAuthorized) {
      setShowDialog(true);
    }
  }, [isAdminLoading, isLockedLoading, isAuthorized]);

  // Handle successful unlock
  const handleUnlockSuccess = () => {
    setShowDialog(false);
  };

  // Handle dialog cancel
  const handleCancel = () => {
    setShowDialog(false);
  };

  // Show loading state
  if (isAdminLoading || isLockedLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show AdminPanel only if authorized
  if (isAuthorized) {
    return <AdminPanel />;
  }

  // Show dialog if not authorized
  return (
    <>
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
      <AdminAccessDialog 
        open={showDialog} 
        onSuccess={handleUnlockSuccess}
        onCancel={handleCancel}
      />
    </>
  );
}
