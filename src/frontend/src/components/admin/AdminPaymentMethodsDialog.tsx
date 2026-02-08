import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useAdminGetAllPaymentMethods, useAdminCreatePaymentMethod, useAdminUpdatePaymentMethod, useAdminDeletePaymentMethod } from '../../hooks/useQueries';
import type { PaymentMethod } from '../../backend';

interface AdminPaymentMethodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminPaymentMethodsDialog({ open, onOpenChange }: AdminPaymentMethodsDialogProps) {
  const { data: paymentMethods, refetch } = useAdminGetAllPaymentMethods();
  const createPaymentMethod = useAdminCreatePaymentMethod();
  const updatePaymentMethod = useAdminUpdatePaymentMethod();
  const deletePaymentMethod = useAdminDeletePaymentMethod();

  const [isCreating, setIsCreating] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', enabled: true });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  useEffect(() => {
    if (editingMethod) {
      setFormData({
        name: editingMethod.name,
        description: editingMethod.description,
        enabled: editingMethod.enabled,
      });
    } else {
      setFormData({ name: '', description: '', enabled: true });
    }
  }, [editingMethod]);

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.description.trim()) return;
    
    createPaymentMethod.mutate(
      { name: formData.name.trim(), description: formData.description.trim() },
      {
        onSuccess: () => {
          setIsCreating(false);
          setFormData({ name: '', description: '', enabled: true });
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!editingMethod || !formData.name.trim() || !formData.description.trim()) return;
    
    updatePaymentMethod.mutate(
      {
        id: editingMethod.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        enabled: formData.enabled,
      },
      {
        onSuccess: () => {
          setEditingMethod(null);
          setFormData({ name: '', description: '', enabled: true });
        },
      }
    );
  };

  const handleDelete = (id: bigint) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      deletePaymentMethod.mutate(id);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingMethod(null);
    setFormData({ name: '', description: '', enabled: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Payment Methods Management
          </DialogTitle>
          <DialogDescription>Add, edit, or remove payment methods available to users</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create/Edit Form */}
          {(isCreating || editingMethod) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingMethod ? 'Edit Payment Method' : 'Create New Payment Method'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="method-name">Name</Label>
                  <Input
                    id="method-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., UPI, Credit Card, Bank Transfer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method-description">Description</Label>
                  <Textarea
                    id="method-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details about this payment method"
                    rows={3}
                  />
                </div>
                {editingMethod && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="method-enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <Label htmlFor="method-enabled">Enabled</Label>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={editingMethod ? handleUpdate : handleCreate}
                    disabled={
                      !formData.name.trim() ||
                      !formData.description.trim() ||
                      createPaymentMethod.isPending ||
                      updatePaymentMethod.isPending
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingMethod ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={createPaymentMethod.isPending || updatePaymentMethod.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Button */}
          {!isCreating && !editingMethod && (
            <Button onClick={() => setIsCreating(true)} className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Payment Method
            </Button>
          )}

          <Separator />

          {/* Payment Methods List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Existing Payment Methods</h3>
            {paymentMethods && paymentMethods.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <Card key={method.id.toString()}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{method.name}</h4>
                              {method.enabled ? (
                                <Badge variant="default" className="text-xs">Enabled</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Disabled</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingMethod(method)}
                              disabled={deletePaymentMethod.isPending}
                            >
                              <Edit className="w-4 h-4" />
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No payment methods configured yet.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
