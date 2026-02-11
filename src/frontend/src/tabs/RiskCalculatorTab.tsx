import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calculator, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { getPipValue, calculateLotSize } from '../lib/riskCalculator';
import { CALCULATOR_TRADING_PAIRS } from '../lib/tradingPairs';

type AccountMode = 'funded' | 'ownCapital' | null;
type FundedAccountSize = '1000' | '2000' | '5000' | '10000' | '25000' | '50000' | '100000' | '200000' | 'other';
type OwnCapitalSize = '50' | '100' | 'other';

export default function RiskCalculatorTab() {
  const [accountMode, setAccountMode] = useState<AccountMode>(null);
  const [fundedAccountSize, setFundedAccountSize] = useState<FundedAccountSize>('10000');
  const [fundedAccountOther, setFundedAccountOther] = useState('');
  const [ownCapitalSize, setOwnCapitalSize] = useState<OwnCapitalSize>('100');
  const [ownCapitalOther, setOwnCapitalOther] = useState('');
  const [riskAmount, setRiskAmount] = useState('');
  const [stopLossPips, setStopLossPips] = useState('');
  const [tradingPair, setTradingPair] = useState('');
  const [customPipValue, setCustomPipValue] = useState('');
  const [validationError, setValidationError] = useState('');
  const [warning, setWarning] = useState('');
  const [result, setResult] = useState<{
    positionSize: number;
    riskAmount: number;
    pipValue: number;
    stopLossPips: number;
  } | null>(null);

  // Clear validation error when inputs change
  useEffect(() => {
    setValidationError('');
    setWarning('');
  }, [riskAmount, stopLossPips, tradingPair, customPipValue, fundedAccountSize, fundedAccountOther, ownCapitalSize, ownCapitalOther]);

  // Reset mode-specific fields when account mode changes
  const handleAccountModeChange = (mode: AccountMode) => {
    setAccountMode(mode);
    setFundedAccountSize('10000');
    setFundedAccountOther('');
    setOwnCapitalSize('100');
    setOwnCapitalOther('');
    setResult(null);
    setValidationError('');
    setWarning('');
  };

  const handleCalculate = () => {
    setValidationError('');
    setWarning('');
    setResult(null);

    // Validate risk amount
    const risk = parseFloat(riskAmount);
    if (!riskAmount || isNaN(risk) || risk <= 0) {
      setValidationError('Please enter a valid risk amount greater than 0');
      return;
    }

    // Validate stop loss pips
    const slPips = parseFloat(stopLossPips);
    if (!stopLossPips || isNaN(slPips) || slPips <= 0) {
      setValidationError('Please enter a valid stop loss in pips greater than 0');
      return;
    }

    // Validate trading pair
    if (!tradingPair) {
      setValidationError('Please select a trading pair');
      return;
    }

    // Get pip value
    let pipValuePerLot = getPipValue(tradingPair);
    
    // Check if custom pip value is required
    if (pipValuePerLot === null) {
      const customPip = parseFloat(customPipValue);
      if (!customPipValue || isNaN(customPip) || customPip <= 0) {
        setValidationError('Please enter a valid custom pip value for this trading pair');
        return;
      }
      pipValuePerLot = customPip;
    }

    // Calculate position size
    const calculation = calculateLotSize(risk, slPips, pipValuePerLot);

    if (!calculation.isValid) {
      setValidationError(calculation.error || 'Calculation failed');
      return;
    }

    // Check if risk exceeds account size (warning, not blocking)
    const selectedAccountSize = getSelectedAccountSize();
    if (selectedAccountSize && risk > selectedAccountSize) {
      setWarning(`Warning: Your risk amount ($${risk.toFixed(2)}) exceeds your account size ($${selectedAccountSize.toFixed(2)}). This is extremely risky!`);
    }

    setResult({
      positionSize: calculation.lotSize,
      riskAmount: risk,
      pipValue: pipValuePerLot,
      stopLossPips: slPips,
    });
  };

  const getSelectedAccountSize = (): number | null => {
    if (accountMode === 'funded') {
      if (fundedAccountSize === 'other') {
        const other = parseFloat(fundedAccountOther);
        return isNaN(other) ? null : other;
      }
      return parseFloat(fundedAccountSize);
    } else if (accountMode === 'ownCapital') {
      if (ownCapitalSize === 'other') {
        const other = parseFloat(ownCapitalOther);
        return isNaN(other) ? null : other;
      }
      return parseFloat(ownCapitalSize);
    }
    return null;
  };

  const requiresCustomPipValue = tradingPair && ['XAUUSD', 'XAGUSD', 'OTHER'].includes(tradingPair);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Risk Calculator</h2>
          <p className="text-sm text-muted-foreground">Calculate optimal position size based on your risk parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Parameters</CardTitle>
            <CardDescription>Enter your trade details to calculate position size</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Mode Selection */}
            <div className="space-y-2">
              <Label htmlFor="accountMode">Account Mode</Label>
              <Select value={accountMode || ''} onValueChange={(value) => handleAccountModeChange(value as AccountMode)}>
                <SelectTrigger id="accountMode">
                  <SelectValue placeholder="Select account mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funded">Funded Account</SelectItem>
                  <SelectItem value="ownCapital">Own Capital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show rest of form only after account mode is selected */}
            {accountMode && (
              <>
                {/* Account Size - Funded Account */}
                {accountMode === 'funded' && (
                  <div className="space-y-2">
                    <Label htmlFor="fundedAccountSize">Account Size (USD)</Label>
                    <Select value={fundedAccountSize} onValueChange={(value) => setFundedAccountSize(value as FundedAccountSize)}>
                      <SelectTrigger id="fundedAccountSize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">$1,000</SelectItem>
                        <SelectItem value="2000">$2,000</SelectItem>
                        <SelectItem value="5000">$5,000</SelectItem>
                        <SelectItem value="10000">$10,000</SelectItem>
                        <SelectItem value="25000">$25,000</SelectItem>
                        <SelectItem value="50000">$50,000</SelectItem>
                        <SelectItem value="100000">$100,000</SelectItem>
                        <SelectItem value="200000">$200,000</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {fundedAccountSize === 'other' && (
                      <Input
                        type="number"
                        placeholder="Enter custom account size"
                        value={fundedAccountOther}
                        onChange={(e) => setFundedAccountOther(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                )}

                {/* Account Size - Own Capital */}
                {accountMode === 'ownCapital' && (
                  <div className="space-y-2">
                    <Label htmlFor="ownCapitalSize">Account Size (USD)</Label>
                    <Select value={ownCapitalSize} onValueChange={(value) => setOwnCapitalSize(value as OwnCapitalSize)}>
                      <SelectTrigger id="ownCapitalSize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">$50</SelectItem>
                        <SelectItem value="100">$100</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {ownCapitalSize === 'other' && (
                      <Input
                        type="number"
                        placeholder="Enter custom account size"
                        value={ownCapitalOther}
                        onChange={(e) => setOwnCapitalOther(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                )}

                {/* Risk Amount */}
                <div className="space-y-2">
                  <Label htmlFor="riskAmount">Risk Amount (USD)</Label>
                  <Input
                    id="riskAmount"
                    type="number"
                    placeholder="100"
                    value={riskAmount}
                    onChange={(e) => setRiskAmount(e.target.value)}
                  />
                </div>

                {/* Stop Loss in Pips */}
                <div className="space-y-2">
                  <Label htmlFor="stopLossPips">Stop Loss (pips)</Label>
                  <Input
                    id="stopLossPips"
                    type="number"
                    placeholder="50"
                    value={stopLossPips}
                    onChange={(e) => setStopLossPips(e.target.value)}
                  />
                </div>

                {/* Trading Pair */}
                <div className="space-y-2">
                  <Label htmlFor="tradingPair">Trading Pair</Label>
                  <Select value={tradingPair} onValueChange={setTradingPair}>
                    <SelectTrigger id="tradingPair">
                      <SelectValue placeholder="Select trading pair" />
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

                {/* Custom Pip Value (for XAUUSD, XAGUSD, OTHER) */}
                {requiresCustomPipValue && (
                  <div className="space-y-2">
                    <Label htmlFor="customPipValue">Custom Pip Value (USD)</Label>
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

                {/* Validation Error */}
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                {/* Warning */}
                {warning && (
                  <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-900 dark:text-amber-100">{warning}</AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Position Size
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
            <CardDescription>Your recommended position size and risk metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                <Alert className="bg-primary/5 border-primary/20">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Position Size</AlertTitle>
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
                <p className="text-muted-foreground">
                  {accountMode 
                    ? 'Enter your trading parameters and click calculate to see results'
                    : 'Select an account mode to begin'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
