import { getPipValueForPair } from './pipValues';

export function getPipValue(pair: string): number | null {
  return getPipValueForPair(pair);
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
