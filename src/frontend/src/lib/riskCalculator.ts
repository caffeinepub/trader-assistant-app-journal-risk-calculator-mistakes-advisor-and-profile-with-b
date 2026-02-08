const PIP_VALUES: Record<string, number> = {
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

export function getPipValue(pair: string): number | null {
  if (pair === 'OTHER' || pair === 'XAUUSD' || pair === 'XAGUSD') {
    return null;
  }
  return PIP_VALUES[pair] || null;
}

export function calculateLotSize(
  riskUSD: number,
  slPips: number,
  pipValuePerLot: number
): { lotSize: number; isValid: boolean; error?: string } {
  if (riskUSD <= 0) {
    return { lotSize: 0, isValid: false, error: 'Risk amount must be greater than 0' };
  }

  if (slPips <= 0) {
    return { lotSize: 0, isValid: false, error: 'Stop loss must be greater than 0 pips' };
  }

  if (pipValuePerLot <= 0) {
    return { lotSize: 0, isValid: false, error: 'Pip value must be greater than 0' };
  }

  const lotSize = riskUSD / (slPips * pipValuePerLot);

  return { lotSize, isValid: true };
}
