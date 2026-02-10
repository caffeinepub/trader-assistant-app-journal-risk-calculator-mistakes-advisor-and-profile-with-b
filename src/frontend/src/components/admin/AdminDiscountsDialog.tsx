import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  useAdminGetAllDiscounts,
  useAdminCreateDiscount,
  useAdminUpdateDiscount,
  useAdminDeleteDiscount,
} from '../../hooks/useQueries';

interface AdminDiscountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminDiscountsDialog({ open, onOpenChange }: AdminDiscountsDialogProps) {
  const { data: discounts, isLoading } = useAdminGetAllDiscounts();
  const createDiscount = useAdminCreateDiscount();
  const updateDiscount = useAdminUpdateDiscount();
  const deleteDiscount = useAdminDeleteDiscount();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [code, setCode] = useState('');
  const [percentage, setPercentage] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const handleCreate = async () => {
    if (!code || !percentage || !validUntil) return;

    const validUntilTimestamp = BigInt(new Date(validUntil).getTime() * 1_000_000);

    await createDiscount.mutateAsync({
      code,
      percentage: parseFloat(percentage),
      validUntil: validUntilTimestamp,
    });

    setCode('');
    setPercentage('');
    setValidUntil('');
    setIsCreating(false);
  };

  const handleUpdate = async (id: bigint) => {
    if (!code || !percentage || !validUntil) return;

    const discount = discounts?.find((d) => d.id === id);
    if (!discount) return;

    const validUntilTimestamp = BigInt(new Date(validUntil).getTime() * 1_000_000);

    await updateDiscount.mutateAsync({
      id,
      code,
      percentage: parseFloat(percentage),
      validUntil: validUntilTimestamp,
      enabled: discount.enabled,
    });

    setCode('');
    setPercentage('');
    setValidUntil('');
    setEditingId(null);
  };

  const handleToggleEnabled = async (id: bigint, enabled: boolean) => {
    const discount = discounts?.find((d) => d.id === id);
    if (!discount) return;

    await updateDiscount.mutateAsync({
      id,
      code: discount.code,
      percentage: discount.percentage,
      validUntil: discount.validUntil,
      enabled,
    });
  };

  const handleDelete = async (id: bigint) => {
    if (confirm('Are you sure you want to delete this discount?')) {
      await deleteDiscount.mutateAsync(id);
    }
  };

  const startEdit = (id: bigint) => {
    const discount = discounts?.find((d) => d.id === id);
    if (!discount) return;

    setEditingId(id);
    setCode(discount.code);
    setPercentage(discount.percentage.toString());
    const date = new Date(Number(discount.validUntil) / 1_000_000);
    setValidUntil(date.toISOString().split('T')[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCode('');
    setPercentage('');
    setValidUntil('');
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Discount Codes Management
          </DialogTitle>
          <DialogDescription className="break-words">
            Create, edit, enable/disable, and delete discount codes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Discount */}
          {!isCreating && !editingId && (
            <Button onClick={() => setIsCreating(true)} className="w-full bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create New Discount Code
            </Button>
          )}

          {/* Create/Edit Form */}
          {(isCreating || editingId !== null) && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Discount Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SAVE20"
                    className="break-words"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Discount Percentage</Label>
                    <Input
                      id="percentage"
                      type="number"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      placeholder="e.g., 20"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => (editingId !== null ? handleUpdate(editingId) : handleCreate())}
                    disabled={
                      !code || !percentage || !validUntil || createDiscount.isPending || updateDiscount.isPending
                    }
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

          {/* Discounts List */}
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading discounts...</p>
            ) : discounts && discounts.length > 0 ? (
              discounts.map((discount) => (
                <Card key={Number(discount.id)}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="font-semibold font-mono break-all">{discount.code}</h3>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={discount.enabled}
                              onCheckedChange={(checked) => handleToggleEnabled(discount.id, checked)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {discount.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>{discount.percentage}% off</span>
                          <span>Valid until: {formatDate(discount.validUntil)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(discount.id)}
                          disabled={editingId !== null || isCreating}
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(discount.id)}
                          disabled={deleteDiscount.isPending}
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
                No discount codes created yet. Create one to get started.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
