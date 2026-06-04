/** Flat interest: principal × rate/100 × periods */
export function flatInterest(principalMinor: number, ratePercent: number, periods: number): number {
  if (principalMinor < 0 || ratePercent < 0 || periods < 0) {
    throw new RangeError("All inputs must be non-negative");
  }
  return Math.round(principalMinor * (ratePercent / 100) * periods);
}

/** Equal installment amount for a flat-rate loan (rounds up to avoid under-collection) */
export function installmentAmount(principalMinor: number, totalInterestMinor: number, count: number): number {
  if (count < 1) throw new RangeError("count must be >= 1");
  return Math.ceil((principalMinor + totalInterestMinor) / count);
}

/** Outstanding balance from remaining installment count */
export function outstandingBalance(installmentMinor: number, totalInstallments: number, paid: number): number {
  return installmentMinor * Math.max(0, totalInstallments - paid);
}

/** Days a scheduled payment is overdue (0 if not yet due) */
export function daysOverdue(dueDateIso: string, referenceDate = new Date()): number {
  const due = new Date(dueDateIso);
  const diffMs = referenceDate.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

/** Simple per-day flat penalty on outstanding principal */
export function dailyPenalty(principalMinor: number, dailyRatePercent: number, days: number): number {
  if (days <= 0) return 0;
  return Math.round(principalMinor * (dailyRatePercent / 100) * days);
}

/** Total repayable amount: principal + flat interest */
export function totalRepayable(principalMinor: number, ratePercent: number, periods: number): number {
  return principalMinor + flatInterest(principalMinor, ratePercent, periods);
}
