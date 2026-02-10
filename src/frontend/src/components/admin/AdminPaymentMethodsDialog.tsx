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
                  <Button
                    onClick={() => (editingId !== null ? handleUpdate(editingId) : handleCreate())}
                    disabled={!name || !description || createPaymentMethod.isPending || updatePaymentMethod.isPending}
                    className="flex-1"
                  >
                    {editingId !== null ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isCreating) setIsCreating(false);
                      if (editingId !== null) cancelEdit();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods List */}
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading payment methods...</p>
            ) : paymentMethods && paymentMethods.length > 0 ? (
              paymentMethods.map((method) => (
                <Card key={Number(method.id)}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="font-semibold break-words">{method.name}</h3>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={method.enabled}
                              onCheckedChange={(checked) => handleToggleEnabled(method.id, checked)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {method.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground break-words">{method.description}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(method.id)}
                          disabled={editingId !== null || isCreating}
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(method.id)}
                          disabled={deletePaymentMethod.isPending}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No payment methods created yet. Create one to get started.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
