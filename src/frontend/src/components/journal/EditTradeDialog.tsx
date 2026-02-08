import { useState } from 'react';
import { useUpdateTrade, useDeleteTrade } from '../../hooks/useQueries';
import type { TradeEntry } from '../../backend';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2 } from 'lucide-react';
import { TRADING_PAIRS } from '../../lib/tradingPairs';

interface Props {
  trade: TradeEntry;
  index: number;
  onClose: () => void;
}

export default function EditTradeDialog({ trade, index, onClose }: Props) {
  const updateTrade = useUpdateTrade();
  const deleteTrade = useDeleteTrade();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const initialDate = new Date(Number(trade.tradeDate) / 1_000_000).toISOString().split('T')[0];
  const [tradeDate, setTradeDate] = useState(initialDate);
  const [session, setSession] = useState(trade.session);
  const [tradingPair, setTradingPair] = useState(trade.tradingPair);
  const [stopLoss, setStopLoss] = useState(trade.stopLoss.toString());
  const [takeProfit, setTakeProfit] = useState(trade.takeProfit.toString());
  const [riskReward, setRiskReward] = useState(trade.riskReward.toString());
  const [riskAmount, setRiskAmount] = useState(trade.riskAmount.toString());
  const [outcome, setOutcome] = useState<'tp' | 'sl'>(trade.outcome ? 'tp' : 'sl');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const date = new Date(tradeDate);
    const timestamp = BigInt(date.getTime() * 1_000_000);

    updateTrade.mutate(
      {
        index: BigInt(index),
        entry: {
          tradeDate: timestamp,
          session,
          tradingPair,
          stopLoss: parseFloat(stopLoss),
          takeProfit: parseFloat(takeProfit),
          riskReward: parseFloat(riskReward),
          riskAmount: parseFloat(riskAmount),
          outcome: outcome === 'tp',
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleDelete = () => {
    deleteTrade.mutate(BigInt(index), {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onClose();
      },
    });
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
            <DialogDescription>Update the details of your trade entry</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-trade-date">Trade Date</Label>
                <Input
                  id="edit-trade-date"
                  type="date"
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-session">Session</Label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger id="edit-session">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asian">Asian</SelectItem>
                    <SelectItem value="London">London</SelectItem>
                    <SelectItem value="New York">New York</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-trading-pair">Trading Pair</Label>
                <Select value={tradingPair} onValueChange={setTradingPair}>
                  <SelectTrigger id="edit-trading-pair">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADING_PAIRS.map((pair) => (
                      <SelectItem key={pair.value} value={pair.value}>
                        {pair.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stop-loss">Stop Loss ($)</Label>
                <Input
                  id="edit-stop-loss"
                  type="number"
                  step="0.01"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-take-profit">Take Profit ($)</Label>
                <Input
                  id="edit-take-profit"
                  type="number"
                  step="0.01"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-risk-reward">Risk/Reward Ratio</Label>
                <Input
                  id="edit-risk-reward"
                  type="number"
                  step="0.01"
                  value={riskReward}
                  onChange={(e) => setRiskReward(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-risk-amount">Risk Amount ($)</Label>
                <Input
                  id="edit-risk-amount"
                  type="number"
                  step="0.01"
                  value={riskAmount}
                  onChange={(e) => setRiskAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Outcome</Label>
              <RadioGroup value={outcome} onValueChange={(value) => setOutcome(value as 'tp' | 'sl')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tp" id="edit-outcome-tp" />
                  <Label htmlFor="edit-outcome-tp" className="font-normal cursor-pointer">
                    Take Profit Hit
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sl" id="edit-outcome-sl" />
                  <Label htmlFor="edit-outcome-sl" className="font-normal cursor-pointer">
                    Stop Loss Hit
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Trade
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateTrade.isPending}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                >
                  {updateTrade.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this trade entry from your journal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTrade.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteTrade.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
