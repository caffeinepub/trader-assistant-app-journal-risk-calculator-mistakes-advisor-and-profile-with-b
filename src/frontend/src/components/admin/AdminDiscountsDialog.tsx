import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useAdminGetAllDiscounts, useAdminCreateDiscount, useAdminUpdateDiscount, useAdminDeleteDiscount } from '../../hooks/useQueries';
import type { Discount } from '../../backend';

interface AdminDiscountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminDiscountsDialog({ open, onOpenChange }: AdminDiscountsDialogProps) {
  const { data: discounts, refetch } = useAdminGetAllDiscounts();
  const createDiscount = useAdminCreateDiscount();
  const updateDiscount = useAdminUpdateDiscount();
  const deleteDiscount = useAdminDeleteDiscount();

  const [isCreating, setIsCreating] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    percentage: 0,
    validUntil: '',
    enabled: true,
  });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  useEffect(() => {
    if (editingDiscount) {
      const date = new Date(Number(editingDiscount.validUntil) / 1_000_000);
      const dateString = date.toISOString().split('T')[0];
      setFormData({
        code: editingDiscount.code,
        percentage: editingDiscount.percentage,
        validUntil: dateString,
        enabled: editingDiscount.enabled,
      });
    } else {
      setFormData({ code: '', percentage: 0, validUntil: '', enabled: true });
    }
  }, [editingDiscount]);

  const handleCreate = () => {
    if (!formData.code.trim() || formData.percentage <= 0 || !formData.validUntil) return;
    
    const validUntilTimestamp = BigInt(new Date(formData.validUntil).getTime() * 1_000_000);
    
    createDiscount.mutate(
      {
        code: formData.code.trim().toUpperCase(),
        percentage: formData.percentage,
        validUntil: validUntilTimestamp,
      },
      {
        onSuccess: () => {
          setIsCreating(false);
          setFormData({ code: '', percentage: 0, validUntil: '', enabled: true });
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!editingDiscount || !formData.code.trim() || formData.percentage <= 0 || !formData.validUntil) return;
    
    const validUntilTimestamp = BigInt(new Date(formData.validUntil).getTime() * 1_000_000);
    
    updateDiscount.mutate(
      {
        id: editingDiscount.id,
        code: formData.code.trim().toUpperCase(),
        percentage: formData.percentage,
        validUntil: validUntilTimestamp,
        enabled: formData.enabled,
      },
      {
        onSuccess: () => {
          setEditingDiscount(null);
          setFormData({ code: '', percentage: 0, validUntil: '', enabled: true });
        },
      }
    );
  };

  const handleDelete = (id: bigint) => {
    if (confirm('Are you sure you want to delete this discount?')) {
      deleteDiscount.mutate(id);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingDiscount(null);
    setFormData({ code: '', percentage: 0, validUntil: '', enabled: true });
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (timestamp: bigint) => {
    return Date.now() * 1_000_000 > Number(timestamp);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-500" />
            Discounts Management
          </DialogTitle>
          <DialogDescription>Create, edit, or remove discount codes for users</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create/Edit Form */}
          {(isCreating || editingDiscount) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-code">Discount Code</Label>
                  <Input
                    id="discount-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20, NEWYEAR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-percentage">Discount Percentage</Label>
                  <Input
                    id="discount-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-valid-until">Valid Until</Label>
                  <Input
                    id="discount-valid-until"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
                {editingDiscount && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="discount-enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <Label htmlFor="discount-enabled">Enabled</Label>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={editingDiscount ? handleUpdate : handleCreate}
                    disabled={
                      !formData.code.trim() ||
                      formData.percentage <= 0 ||
                      !formData.validUntil ||
                      createDiscount.isPending ||
                      updateDiscount.isPending
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingDiscount ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={createDiscount.isPending || updateDiscount.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Button */}
          {!isCreating && !editingDiscount && (
            <Button onClick={() => setIsCreating(true)} className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Discount
            </Button>
          )}

          <Separator />

          {/* Discounts List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Existing Discounts</h3>
            {discounts && discounts.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {discounts.map((discount) => (
                    <Card key={discount.id.toString()}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold font-mono">{discount.code}</h4>
                              <Badge variant="secondary">{discount.percentage}% OFF</Badge>
                              {discount.enabled ? (
                                <Badge variant="default" className="text-xs">Enabled</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Disabled</Badge>
                              )}
                              {isExpired(discount.validUntil) && (
                                <Badge variant="destructive" className="text-xs">Expired</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Valid until: {formatDate(discount.validUntil)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingDiscount(discount)}
                              disabled={deleteDiscount.isPending}
                            >
                              <Edit className="w-4 h-4" />
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No discounts configured yet.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
