import { useState } from 'react';
import type { TradeEntry } from '../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Trash2 } from 'lucide-react';
import EditTradeDialog from './EditTradeDialog';
import { calculatePL } from '../../lib/trades';

interface Props {
  trades: TradeEntry[];
  isLoading: boolean;
  compact?: boolean;
}

export default function TradeList({ trades, isLoading, compact = false }: Props) {
  const [editingTrade, setEditingTrade] = useState<{ trade: TradeEntry; index: number } | null>(null);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Your recorded trades will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No trades recorded yet. Add your first trade above!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {!compact && (
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
            <CardDescription>{trades.length} trade{trades.length !== 1 ? 's' : ''} recorded</CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>R:R</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                  {!compact && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, index) => {
                  const pl = calculatePL(trade);
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{formatDate(trade.tradeDate)}</TableCell>
                      <TableCell>{trade.tradingPair}</TableCell>
                      <TableCell>{trade.session}</TableCell>
                      <TableCell>1:{trade.riskReward}</TableCell>
                      <TableCell>
                        <Badge variant={trade.outcome ? 'default' : 'destructive'} className={trade.outcome ? 'bg-green-600' : ''}>
                          {trade.outcome ? 'TP Hit' : 'SL Hit'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${pl.toFixed(2)}
                      </TableCell>
                      {!compact && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTrade({ trade, index })}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingTrade && (
        <EditTradeDialog
          trade={editingTrade.trade}
          index={editingTrade.index}
          onClose={() => setEditingTrade(null)}
        />
      )}
    </>
  );
}
