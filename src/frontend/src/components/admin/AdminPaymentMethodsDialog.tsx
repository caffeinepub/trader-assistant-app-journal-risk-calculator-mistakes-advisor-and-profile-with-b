import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  useAdminGetAllPaymentMethods,
  useAdminCreatePaymentMethod,
  useAdminUpdatePaymentMethod,
  useAdminDeletePaymentMethod,
} from '../../hooks/useQueries';

interface AdminPaymentMethodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminPaymentMethodsDialog({ open, onOpenChange }: AdminPaymentMethodsDialogProps) {
  const { data: paymentMethods, isLoading } = useAdminGetAllPaymentMethods();
  const createPaymentMethod = useAdminCreatePaymentMethod();
  const updatePaymentMethod = useAdminUpdatePaymentMethod();
  const deletePaymentMethod = useAdminDeletePaymentMethod();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name || !description) return;

    await createPaymentMethod.mutateAsync({ name, description });
    setName('');
    setDescription('');
    setIsCreating(false);
  };

  const handleUpdate = async (id: bigint) => {
    if (!name || !description) return;

    const method = paymentMethods?.find((m) => m.id === id);
    if (!method) return;

    await updatePaymentMethod.mutateAsync({
      id,
      name,
      description,
      enabled: method.enabled,
    });

    setName('');
    setDescription('');
    setEditingId(null);
  };

  const handleToggleEnabled = async (id: bigint, enabled: boolean) => {
    const method = paymentMethods?.find((m) => m.id === id);
    if (!method) return;

    await updatePaymentMethod.mutateAsync({
      id,
      name: method.name,
      description: method.description,
      enabled,
    });
  };

  const handleDelete = async (id: bigint) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      await deletePaymentMethod.mutateAsync(id);
    }
  };

  const startEdit = (id: bigint) => {
    const method = paymentMethods?.find((m) => m.id === id);
    if (!method) return;

    setEditingId(id);
    setName(method.name);
    setDescription(method.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Methods Management
          </DialogTitle>
          <DialogDescription className="break-words">
            Create, edit, enable/disable, and delete payment methods
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Payment Method */}
          {!isCreating && !editingId && (
            <Button onClick={() => setIsCreating(true)} className="w-full bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create New Payment Method
            </Button>
          )}

          {/* Create/Edit Form */}
          {(isCreating || editingId !== null) && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Payment Method Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., UPI, Bank Transfer"
                    className="break-words"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter payment method details (e.g., UPI ID, bank account number)"
                    rows={3}
                    className="break-words"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {isCreating ? (
                    <>
                      <Button
                        onClick={handleCreate}
                        disabled={createPaymentMethod.isPending || !name || !description}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        {createPaymentMethod.isPending ? 'Creating...' : 'Create Payment Method'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsCreating(false);
                          setName('');
                          setDescription('');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => editingId && handleUpdate(editingId)}
                        disabled={updatePaymentMethod.isPending || !name || !description}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        {updatePaymentMethod.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Payment Methods */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Existing Payment Methods</h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : paymentMethods && paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <Card key={method.id.toString()}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="font-semibold text-lg break-words">{method.name}</p>
                          <p className="text-sm text-muted-foreground break-words">{method.description}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`enabled-${method.id}`} className="text-sm">
                              {method.enabled ? 'Enabled' : 'Disabled'}
                            </Label>
                            <Switch
                              id={`enabled-${method.id}`}
                              checked={method.enabled}
                              onCheckedChange={(checked) => handleToggleEnabled(method.id, checked)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(method.id)}
                              disabled={editingId !== null || isCreating}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(method.id)}
                              disabled={deletePaymentMethod.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payment methods created yet</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
