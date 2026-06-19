import type { AppState, CalculationResult } from "../state/types";

/**
 * Calculate balance for each participant across all events.
 * Positive balance = person is owed money
 * Negative balance = person owes money
 */
export function calculateBalances(state: AppState): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const p of state.participants) {
    totals[p.id] = 0;
  }

  for (const event of state.events) {
    for (const pid in event.entries) {
      const { expected, actual } = event.entries[pid];
      totals[pid] += actual - expected;
    }
  }

  for (const pid in totals) {
    totals[pid] = Math.round(totals[pid] * 100) / 100;
  }

  return totals;
}

/**
 * Calculate per-event net balance for each participant.
 * eventBalances[eventId][participantId] = actual - expected
 */
export function calculateEventBalances(
  state: AppState,
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  for (const event of state.events) {
    result[event.id] = {};
    for (const pid in event.entries) {
      const { expected, actual, included } = event.entries[pid];
      if (included) {
        result[event.id][pid] = Math.round((actual - expected) * 100) / 100;
      } else {
        result[event.id][pid] = 0;
      }
    }
    // Ensure all participants appear
    for (const p of state.participants) {
      if (!(p.id in result[event.id])) {
        result[event.id][p.id] = 0;
      }
    }
  }

  return result;
}

/**
 * Settle debts using a greedy algorithm.
 */
export function settleDebts(
  balances: Record<string, number>,
): { from: string; to: string; amount: number }[] {
  const creditors: { pid: string; amount: number }[] = [];
  const debtors: { pid: string; amount: number }[] = [];

  for (const [pid, amount] of Object.entries(balances)) {
    if (amount > 0.001) {
      creditors.push({ pid, amount });
    } else if (amount < -0.001) {
      debtors.push({ pid, amount: -amount });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: { from: string; to: string; amount: number }[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const transfer = Math.min(d.amount, c.amount);

    if (transfer > 0.001) {
      settlements.push({
        from: d.pid,
        to: c.pid,
        amount: Math.round(transfer * 100) / 100,
      });
    }

    d.amount -= transfer;
    c.amount -= transfer;

    d.amount = Math.round(d.amount * 100) / 100;
    c.amount = Math.round(c.amount * 100) / 100;

    if (d.amount <= 0.001) i++;
    if (c.amount <= 0.001) j++;
  }

  return settlements;
}

export function runCalculation(state: AppState): CalculationResult {
  const balances = calculateBalances(state);
  const settlements = settleDebts(balances);
  const eventBalances = calculateEventBalances(state);
  return { balances, settlements, eventBalances };
}
