import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { calculateLotSize } from '../lib/riskCalculator';
import { getPipValueForPair } from '../lib/pipValues';
import { CALCULATOR_TRADING_PAIRS } from '../lib/tradingPairs';

type AccountType = 'standard' | 'mini' | 'micro';
type RiskMode = 'percentage' | 'fixed';

interface ValidationError {
  field: string;
  message: string;
}

export default function RiskCalculatorTab() {
  const [accountType, setAccountType] = useState<AccountType>('standard');
  const [riskMode, setRiskMode] = useState<RiskMode>('percentage');
  const [accountBalance, setAccountBalance] = useState('');
  const [riskPercentage, setRiskPercentage] = useState('');
  const [fixedRiskAmount, setFixedRiskAmount] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [tradingPair, setTradingPair] = useState('');
  const [customPipValue, setCustomPipValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [result, setResult] = useState<{
    positionSize: number;
    riskAmount: number;
    pipValue: number;
    stopLossPips: number;
  } | null>(null);

  const handleCalculate = () => {
    const errors: ValidationError[] = [];
    
    const balance = parseFloat(accountBalance);
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const riskPct = riskMode === 'percentage' ? parseFloat(riskPercentage) : null;
    const fixedRisk = riskMode === 'fixed' ? parseFloat(fixedRiskAmount) : null;
    const customPip = customPipValue ? parseFloat(customPipValue) : null;

    // Validate all required fields
    if (!accountBalance || isNaN(balance) || balance <= 0) {
      errors.push({ field: 'accountBalance', message: 'Please enter a valid account balance greater than 0' });
    }

    if (!tradingPair) {
      errors.push({ field: 'tradingPair', message: 'Please select a trading pair' });
    }

    if (riskMode === 'percentage') {
      if (!riskPercentage || isNaN(riskPct!) || riskPct! <= 0) {
        errors.push({ field: 'riskPercentage', message: 'Please enter a valid risk percentage greater than 0' });
      }
    } else {
      if (!fixedRiskAmount || isNaN(fixedRisk!) || fixedRisk! <= 0) {
        errors.push({ field: 'fixedRiskAmount', message: 'Please enter a valid fixed risk amount greater than 0' });
      }
    }

    if (!entryPrice || isNaN(entry) || entry <= 0) {
      errors.push({ field: 'entryPrice', message: 'Please enter a valid entry price greater than 0' });
    }

    if (!stopLoss || isNaN(sl) || sl <= 0) {
      errors.push({ field: 'stopLoss', message: 'Please enter a valid stop loss price greater than 0' });
    }

    // Check if custom pip value is required
    const requiresCustomPipValue = tradingPair && ['XAUUSD', 'XAGUSD', 'OTHER'].includes(tradingPair);
    if (requiresCustomPipValue && (!customPipValue || isNaN(customPip!) || customPip! <= 0)) {
      errors.push({ 
        field: 'customPipValue', 
        message: 'This trading pair requires a custom pip value. Please enter a valid pip value greater than 0' 
      });
    }

    // If there are validation errors, show them and return
    if (errors.length > 0) {
      setValidationErrors(errors);
      setResult(null);
      return;
    }

    // Clear validation errors
    setValidationErrors([]);

    // Calculate risk amount
    const riskAmount = riskMode === 'percentage' ? (balance * (riskPct || 0)) / 100 : (fixedRisk || 0);

    // Get pip value
    let pipValuePerLot = customPip || getPipValueForPair(tradingPair);
    if (pipValuePerLot === null) {
      setValidationErrors([{ 
        field: 'customPipValue', 
        message: 'Please enter a custom pip value for this trading pair' 
      }]);
      return;
    }

    // Adjust pip value based on account type
    const lotMultiplier = accountType === 'standard' ? 1 : accountType === 'mini' ? 0.1 : 0.01;
    pipValuePerLot = pipValuePerLot * lotMultiplier;

    // Calculate stop loss in pips
    const stopLossPips = Math.abs(entry - sl) * (tradingPair.includes('JPY') ? 100 : 10000);

    if (stopLossPips <= 0) {
      setValidationErrors([{ 
        field: 'stopLoss', 
        message: 'Stop loss must be different from entry price' 
      }]);
      return;
    }

    // Calculate position size
    const calculation = calculateLotSize(riskAmount, stopLossPips, pipValuePerLot);

    if (!calculation.isValid) {
      setValidationErrors([{ 
        field: 'general', 
        message: calculation.error || 'Calculation failed' 
      }]);
      return;
    }

    setResult({
      positionSize: calculation.lotSize,
      riskAmount,
      pipValue: pipValuePerLot,
      stopLossPips,
    });
  };

  const requiresCustomPipValue = tradingPair && ['XAUUSD', 'XAGUSD', 'OTHER'].includes(tradingPair);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Lot Size Calculator</h2>
          <p className="text-sm text-muted-foreground">Calculate optimal lot size based on your account and risk parameters</p>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Please fix the following errors:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Account & Risk Parameters</CardTitle>
            <CardDescription>Enter your account details and risk settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select value={accountType} onValueChange={(value) => setAccountType(value as AccountType)}>
                <SelectTrigger id="accountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (100,000 units)</SelectItem>
                  <SelectItem value="mini">Mini (10,000 units)</SelectItem>
                  <SelectItem value="micro">Micro (1,000 units)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Mode */}
            <div className="space-y-2">
              <Label htmlFor="riskMode">Risk Mode</Label>
              <Select value={riskMode} onValueChange={(value) => setRiskMode(value as RiskMode)}>
                <SelectTrigger id="riskMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage of Balance</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Balance */}
            <div className="space-y-2">
              <Label htmlFor="accountBalance">Account Balance ($)</Label>
              <Input
                id="accountBalance"
                type="number"
                placeholder="10000"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
              />
            </div>

            {/* Risk Input (Percentage or Fixed) */}
            {riskMode === 'percentage' ? (
              <div className="space-y-2">
                <Label htmlFor="riskPercentage">Risk Percentage (%)</Label>
                <Input
                  id="riskPercentage"
                  type="number"
                  placeholder="1"
                  value={riskPercentage}
                  onChange={(e) => setRiskPercentage(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fixedRiskAmount">Fixed Risk Amount ($)</Label>
                <Input
                  id="fixedRiskAmount"
                  type="number"
                  placeholder="100"
                  value={fixedRiskAmount}
                  onChange={(e) => setFixedRiskAmount(e.target.value)}
                />
              </div>
            )}

            {/* Trading Pair */}
            <div className="space-y-2">
              <Label htmlFor="tradingPair">Trading Pair</Label>
              <Select value={tradingPair} onValueChange={setTradingPair}>
                <SelectTrigger id="tradingPair">
                  <SelectValue placeholder="Select trading pair" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {CALCULATOR_TRADING_PAIRS.map((pair) => (
                    <SelectItem key={pair.value} value={pair.value}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Pip Value (for XAUUSD, XAGUSD, OTHER) */}
            {requiresCustomPipValue && (
              <div className="space-y-2">
                <Label htmlFor="customPipValue">Custom Pip Value ($)</Label>
                <Input
                  id="customPipValue"
                  type="number"
                  placeholder="Enter pip value"
                  value={customPipValue}
                  onChange={(e) => setCustomPipValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This pair requires a custom pip value. Please enter the pip value for your broker.
                </p>
              </div>
            )}

            {/* Entry Price */}
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                type="number"
                placeholder="1.1000"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
              />
            </div>

            {/* Stop Loss */}
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input
                id="stopLoss"
                type="number"
                placeholder="1.0950"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
              />
            </div>

            <Button onClick={handleCalculate} className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Lot Size
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
            <CardDescription>Your recommended lot size and risk metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                <Alert className="bg-primary/5 border-primary/20">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Lot Size</AlertTitle>
                  <AlertDescription>
                    <span className="text-3xl font-bold text-primary">{result.positionSize.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2">lots</span>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Risk Amount</span>
                    <span className="font-semibold">${result.riskAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Stop Loss (Pips)</span>
                    <span className="font-semibold">{result.stopLossPips.toFixed(1)} pips</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Pip Value</span>
                    <span className="font-semibold">${result.pipValue.toFixed(2)}</span>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Always verify calculations with your broker's specifications. Market conditions may affect actual
                    position sizes.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Enter your account and risk parameters, then click calculate to see your recommended lot size</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
