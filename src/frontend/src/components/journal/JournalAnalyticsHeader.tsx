import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  totalTrades: bigint;
  winningTrades: bigint;
  losingTrades: bigint;
  accuracy: number;
  totalPL: number;
  grossProfit: number;
  grossLoss: number;
}

interface Props {
  analytics?: AnalyticsData | null;
}

export default function JournalAnalyticsHeader({ analytics }: Props) {
  if (!analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const accuracyPercent = (analytics.accuracy * 100).toFixed(1);
  const totalTradesNum = Number(analytics.totalTrades);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
              <p className="text-3xl font-bold mt-2">{totalTradesNum}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
              <p className="text-3xl font-bold mt-2">{accuracyPercent}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Number(analytics.winningTrades)}W / {Number(analytics.losingTrades)}L
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`border-l-4 ${analytics.totalPL >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total P/L</p>
              <p className={`text-3xl font-bold mt-2 ${analytics.totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${analytics.totalPL.toFixed(2)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full ${analytics.totalPL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
              <DollarSign className={`w-6 h-6 ${analytics.totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
