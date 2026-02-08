import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calculator, TrendingUp } from 'lucide-react';
import { calculateLotSize, getPipValue } from '../lib/riskCalculator';
import { CALCULATOR_TRADING_PAIRS } from '../lib/tradingPairs';

type AccountType = 'funded' | 'own';
type RiskMode = 'percentage' | 'fixed';

const FUNDED_PRESETS = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000];
const OWN_PRESETS = [50, 100];

export default function RiskCalculatorTab() {
  const [accountType, setAccountType] = useState<AccountType>('funded');
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [customAccountSize, setCustomAccountSize] = useState<string>('');
  const [riskMode, setRiskMode] = useState<RiskMode>('percentage');
  const [riskPercentage, setRiskPercentage] = useState<string>('1');
  const [riskFixed, setRiskFixed] = useState<string>('100');
  const [slPips, setSlPips] = useState<string>('20');
  const [tradingPair, setTradingPair] = useState<string>('EURUSD');
  const [customPipValue, setCustomPipValue] = useState<string>('');

  const pipValue = getPipValue(tradingPair);
  const needsCustomPipValue = pipValue === null;
  const effectivePipValue = needsCustomPipValue ? parseFloat(customPipValue) || 0 : pipValue;

  // Clear custom pip value when switching to a pair with built-in mapping
  useEffect(() => {
    if (!needsCustomPipValue && customPipValue) {
      setCustomPipValue('');
    }
  }, [needsCustomPipValue]);

  const effectiveAccountSize = customAccountSize ? parseFloat(customAccountSize) : accountSize;
  const riskUSD =
    riskMode === 'percentage'
      ? (effectiveAccountSize * parseFloat(riskPercentage || '0')) / 100
      : parseFloat(riskFixed || '0');

  const result = calculateLotSize(riskUSD, parseFloat(slPips || '0'), effectivePipValue);
  const units = result.lotSize * 100000; // 1 lot = 100,000 units

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            Risk Management Calculator
          </CardTitle>
          <CardDescription>Calculate optimal lot size based on your risk parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Type */}
          <div className="space-y-3">
            <Label>Account Type</Label>
            <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="funded" id="funded" />
                <Label htmlFor="funded" className="font-normal cursor-pointer">
                  Funded Account
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="own" id="own" />
                <Label htmlFor="own" className="font-normal cursor-pointer">
                  Own Capital
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Account Size */}
          <div className="space-y-3">
            <Label>Account Size (USD)</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(accountType === 'funded' ? FUNDED_PRESETS : OWN_PRESETS).map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAccountSize(preset);
                    setCustomAccountSize('');
                  }}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    accountSize === preset && !customAccountSize
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-border hover:border-blue-500'
                  }`}
                >
                  ${preset.toLocaleString()}
                </button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Custom amount"
              value={customAccountSize}
              onChange={(e) => setCustomAccountSize(e.target.value)}
              min="0"
            />
          </div>

          {/* Risk Mode */}
          <div className="space-y-3">
            <Label>Risk Mode</Label>
            <RadioGroup value={riskMode} onValueChange={(v) => setRiskMode(v as RiskMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">
                  Percentage of Account
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Fixed Amount (USD)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Risk Input */}
          <div className="space-y-2">
            <Label htmlFor="risk">
              {riskMode === 'percentage' ? 'Risk Percentage (%)' : 'Risk Amount (USD)'}
            </Label>
            <Input
              id="risk"
              type="number"
              placeholder={riskMode === 'percentage' ? '1' : '100'}
              value={riskMode === 'percentage' ? riskPercentage : riskFixed}
              onChange={(e) =>
                riskMode === 'percentage'
                  ? setRiskPercentage(e.target.value)
                  : setRiskFixed(e.target.value)
              }
              step={riskMode === 'percentage' ? '0.1' : '1'}
              min="0"
            />
          </div>

          {/* Trading Pair */}
          <div className="space-y-2">
            <Label htmlFor="pair">Trading Pair</Label>
            <Select value={tradingPair} onValueChange={setTradingPair}>
              <SelectTrigger id="pair">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALCULATOR_TRADING_PAIRS.map((pair) => (
                  <SelectItem key={pair.value} value={pair.value}>
                    {pair.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Pip Value (conditional) */}
          {needsCustomPipValue && (
            <div className="space-y-2">
              <Label htmlFor="customPipValue">Pip Value (USD per pip for 1 lot)</Label>
              <Input
                id="customPipValue"
                type="number"
                placeholder="e.g., 10 for XAUUSD"
                value={customPipValue}
                onChange={(e) => setCustomPipValue(e.target.value)}
                step="0.01"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Enter the pip value for this pair. For XAUUSD, it's typically $10 per pip for 1 lot.
              </p>
            </div>
          )}

          {/* Stop Loss Pips */}
          <div className="space-y-2">
            <Label htmlFor="slPips">Stop Loss (Pips)</Label>
            <Input
              id="slPips"
              type="number"
              placeholder="20"
              value={slPips}
              onChange={(e) => setSlPips(e.target.value)}
              step="1"
              min="0"
            />
          </div>

          {/* Results */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-500">Calculated Results</h3>
                  <p className="text-sm text-muted-foreground">Optimal position sizing</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Risk Amount:</span>
                  <span className="text-lg font-bold">${riskUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lot Size:</span>
                  <span className="text-2xl font-bold text-blue-500">{result.lotSize.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Units:</span>
                  <span className="text-lg font-semibold">{units.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
