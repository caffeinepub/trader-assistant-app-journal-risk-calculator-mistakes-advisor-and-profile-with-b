import { useState } from 'react';
import type { MistakeEntry } from '../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Lightbulb } from 'lucide-react';
import EditMistakeDialog from './EditMistakeDialog';

interface Props {
  mistakes: MistakeEntry[];
  isLoading: boolean;
}

export default function MistakeList({ mistakes, isLoading }: Props) {
  const [editingMistake, setEditingMistake] = useState<MistakeEntry | null>(null);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      riskManagement: 'Risk Management',
      positionSizing: 'Position Sizing',
      emotionalControl: 'Emotional Control',
      tradeTiming: 'Trade Timing',
      overtrading: 'Overtrading',
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mistakes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mistake Log</CardTitle>
          <CardDescription>Your logged mistakes will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No mistakes logged yet. Start documenting your learning journey!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Mistake Log</CardTitle>
          <CardDescription>{mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} logged</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mistakes.map((mistake) => (
            <Card key={Number(mistake.id)} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{getCategoryLabel(mistake.category)}</Badge>
                      <span className="text-sm text-muted-foreground">{formatDate(mistake.tradeDate)}</span>
                    </div>
                    <p className="text-sm break-words">{mistake.description}</p>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-500 mb-1">AI Suggestion</p>
                          <p className="text-sm text-foreground/90 break-words overflow-wrap-anywhere">{mistake.suggestion.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingMistake(mistake)}
                    className="shrink-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {editingMistake && (
        <EditMistakeDialog
          mistake={editingMistake}
          onClose={() => setEditingMistake(null)}
        />
      )}
    </>
  );
}
