import { useState } from 'react';
import { useCreateTrade } from '../../hooks/useQueries';
import { useActor } from '../../hooks/useActor';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Loader2 } from 'lucide-react';
import { TRADING_PAIRS } from '../../lib/tradingPairs';

export default function TradeEntryForm() {
  const createTrade = useCreateTrade();
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('London');
  const [tradingPair, setTradingPair] = useState('EURUSD');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [riskReward, setRiskReward] = useState('');
  const [riskAmount, setRiskAmount] = useState('');
  const [outcome, setOutcome] = useState<'tp' | 'sl'>('tp');

  const isReady = !!actor && !isFetching && !isInitializing;
  const isConnecting = isFetching || isInitializing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional defensive check
    if (!isReady) {
      return;
    }
    
    const date = new Date(tradeDate);
    const timestamp = BigInt(date.getTime() * 1_000_000);

    createTrade.mutate(
      {
        tradeDate: timestamp,
        session,
        tradingPair,
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
        riskReward: parseFloat(riskReward),
        riskAmount: parseFloat(riskAmount),
        outcome: outcome === 'tp',
      },
      {
        onSuccess: () => {
          setStopLoss('');
          setTakeProfit('');
          setRiskReward('');
          setRiskAmount('');
          setOutcome('tp');
        },
      }
    );
  };

  const isSubmitDisabled = !isReady || createTrade.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Trade</CardTitle>
        <CardDescription>Record your trade details for analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {isConnecting && (
          <Alert className="mb-4 border-blue-600/20 bg-blue-600/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="ml-2 text-sm">
              Connecting to backend... Please wait a moment.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Trade Date</Label>
              <Input
                id="date"
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                required
                disabled={!isReady}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select value={session} onValueChange={setSession} disabled={!isReady}>
                <SelectTrigger id="session">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asian">Asian</SelectItem>
                  <SelectItem value="London">London</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                  <SelectItem value="Sydney">Sydney</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pair">Trading Pair</Label>
              <Select value={tradingPair} onValueChange={setTradingPair} disabled={!isReady}>
                <SelectTrigger id="pair">
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
              <Label htmlFor="riskAmount">Risk Amount (USD)</Label>
              <Input
                id="riskAmount"
                type="number"
                placeholder="100"
                value={riskAmount}
                onChange={(e) => setRiskAmount(e.target.value)}
                step="0.01"
                min="0"
                required
                disabled={!isReady}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sl">Stop Loss</Label>
              <Input
                id="sl"
                type="number"
                placeholder="1.0850"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                step="0.00001"
                required
                disabled={!isReady}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tp">Take Profit</Label>
              <Input
                id="tp"
                type="number"
                placeholder="1.0900"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                step="0.00001"
                required
                disabled={!isReady}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rr">Risk:Reward Ratio</Label>
              <Input
                id="rr"
                type="number"
                placeholder="2"
                value={riskReward}
                onChange={(e) => setRiskReward(e.target.value)}
                step="0.1"
                min="0"
                required
                disabled={!isReady}
              />
            </div>

            <div className="space-y-2">
              <Label>Outcome</Label>
              <RadioGroup 
                value={outcome} 
                onValueChange={(v) => setOutcome(v as 'tp' | 'sl')}
                disabled={!isReady}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tp" id="tp-hit" disabled={!isReady} />
                  <Label htmlFor="tp-hit" className="font-normal cursor-pointer">
                    TP Hit (Win)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sl" id="sl-hit" disabled={!isReady} />
                  <Label htmlFor="sl-hit" className="font-normal cursor-pointer">
                    SL Hit (Loss)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitDisabled}
          >
            {createTrade.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Trade...
              </>
            ) : isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Trade
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
