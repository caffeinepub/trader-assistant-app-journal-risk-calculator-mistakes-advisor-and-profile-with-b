export const PIP_VALUES: Record<string, number> = {
  EURUSD: 10,
  GBPUSD: 10,
  AUDUSD: 10,
  NZDUSD: 10,
  USDJPY: 9.09,
  USDCHF: 10,
  USDCAD: 7.69,
  EURGBP: 12.5,
  EURJPY: 9.09,
  GBPJPY: 9.09,
};

export function getPipValueForPair(pair: string): number | null {
  if (pair === 'OTHER' || pair === 'XAUUSD' || pair === 'XAGUSD') {
    return null;
  }
  return PIP_VALUES[pair] || null;
}
