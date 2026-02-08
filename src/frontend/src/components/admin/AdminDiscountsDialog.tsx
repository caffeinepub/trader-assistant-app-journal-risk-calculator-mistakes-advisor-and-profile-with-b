import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAdminGetAllDiscounts, useAdminCreateDiscount, useAdminUpdateDiscount, useAdminDeleteDiscount } from '../../hooks/useQueries';

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

    const validUntilDate = new Date(validUntil);
    const validUntilNano = BigInt(validUntilDate.getTime()) * BigInt(1_000_000);

    await createDiscount.mutateAsync({
      code,
      percentage: parseFloat(percentage),
      validUntil: validUntilNano,
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

    const validUntilDate = new Date(validUntil);
    const validUntilNano = BigInt(validUntilDate.getTime()) * BigInt(1_000_000);

    await updateDiscount.mutateAsync({
      id,
      code,
      percentage: parseFloat(percentage),
      validUntil: validUntilNano,
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
    const validUntilDate = new Date(Number(discount.validUntil) / 1_000_000);
    setValidUntil(validUntilDate.toISOString().split('T')[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCode('');
    setPercentage('');
    setValidUntil('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Discount Management
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
              Create New Discount
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
                    className="break-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Discount %</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      placeholder="e.g., 20"
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
                  {isCreating ? (
                    <>
                      <Button
                        onClick={handleCreate}
                        disabled={createDiscount.isPending || !code || !percentage || !validUntil}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        {createDiscount.isPending ? 'Creating...' : 'Create Discount'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsCreating(false);
                          setCode('');
                          setPercentage('');
                          setValidUntil('');
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
                        disabled={updateDiscount.isPending || !code || !percentage || !validUntil}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        {updateDiscount.isPending ? 'Saving...' : 'Save Changes'}
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

          {/* Existing Discounts */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Existing Discounts</h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : discounts && discounts.length > 0 ? (
              <div className="space-y-3">
                {discounts.map((discount) => {
                  const validUntilDate = new Date(Number(discount.validUntil) / 1_000_000);
                  const isExpired = validUntilDate < new Date();
                  
                  return (
                    <Card key={discount.id.toString()}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="font-semibold text-lg break-all">{discount.code}</p>
                            <p className="text-sm text-muted-foreground">
                              {discount.percentage}% off • Valid until {validUntilDate.toLocaleDateString()}
                              {isExpired && <span className="text-destructive ml-2">(Expired)</span>}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`enabled-${discount.id}`} className="text-sm">
                                {discount.enabled ? 'Enabled' : 'Disabled'}
                              </Label>
                              <Switch
                                id={`enabled-${discount.id}`}
                                checked={discount.enabled}
                                onCheckedChange={(checked) => handleToggleEnabled(discount.id, checked)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(discount.id)}
                                disabled={editingId !== null || isCreating}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(discount.id)}
                                disabled={deleteDiscount.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No discounts created yet</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
