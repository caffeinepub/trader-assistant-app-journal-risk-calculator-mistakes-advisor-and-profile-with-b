import type { TradeEntry } from '../backend';

export function calculatePL(trade: TradeEntry): number {
  if (trade.outcome) {
    return trade.riskAmount * trade.riskReward;
  } else {
    return -trade.riskAmount;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatSignedPL(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}$${abs.toFixed(0)}`;
}
