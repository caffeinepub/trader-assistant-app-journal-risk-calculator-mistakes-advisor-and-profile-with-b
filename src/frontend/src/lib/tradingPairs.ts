export interface TradingPairOption {
  value: string;
  label: string;
}

export const TRADING_PAIRS: TradingPairOption[] = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'USDCHF', label: 'USD/CHF' },
  { value: 'AUDUSD', label: 'AUD/USD' },
  { value: 'NZDUSD', label: 'NZD/USD' },
  { value: 'USDCAD', label: 'USD/CAD' },
  { value: 'XAUUSD', label: 'XAU/USD (Gold)' },
  { value: 'XAGUSD', label: 'XAG/USD (Silver)' },
];

export const CALCULATOR_TRADING_PAIRS: TradingPairOption[] = [
  ...TRADING_PAIRS,
  { value: 'EURGBP', label: 'EUR/GBP' },
  { value: 'EURJPY', label: 'EUR/JPY' },
  { value: 'GBPJPY', label: 'GBP/JPY' },
  { value: 'OTHER', label: 'Other (Custom)' },
];
