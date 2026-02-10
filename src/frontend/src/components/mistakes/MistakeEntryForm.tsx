import { useState } from 'react';
import { useCreateMistake } from '../../hooks/useQueries';
import { MistakeCategory } from '../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function MistakeEntryForm() {
  const createMistake = useCreateMistake();
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<MistakeCategory>(MistakeCategory.riskManagement);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const date = new Date(tradeDate);
    const timestamp = BigInt(date.getTime() * 1_000_000);

    createMistake.mutate(
      {
        category,
        description: description.trim(),
        tradeDate: timestamp,
      },
      {
        onSuccess: () => {
          setDescription('');
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a Mistake</CardTitle>
        <CardDescription>Document your trading mistakes to learn and improve</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mistake-date">Date</Label>
              <Input
                id="mistake-date"
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MistakeCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MistakeCategory.riskManagement}>Risk Management</SelectItem>
                  <SelectItem value={MistakeCategory.positionSizing}>Position Sizing</SelectItem>
                  <SelectItem value={MistakeCategory.emotionalControl}>Emotional Control</SelectItem>
                  <SelectItem value={MistakeCategory.tradeTiming}>Trade Timing</SelectItem>
                  <SelectItem value={MistakeCategory.overtrading}>Overtrading</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what went wrong and what you learned..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMistake.isPending || !description.trim()}
          >
            {createMistake.isPending ? (
              <>
                <PlusCircle className="w-4 h-4 mr-2 animate-spin" />
                Logging Mistake...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                Log Mistake
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
