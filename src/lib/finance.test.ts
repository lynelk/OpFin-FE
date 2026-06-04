import { describe, expect, it } from "vitest";
import {
  flatInterest,
  installmentAmount,
  outstandingBalance,
  daysOverdue,
  dailyPenalty,
  totalRepayable,
} from "./finance";

describe("flatInterest", () => {
  it("computes flat monthly interest correctly", () => {
    // 500,000 UGX at 10% for 1 month = 50,000
    expect(flatInterest(500_000, 10, 1)).toBe(50_000);
  });

  it("scales linearly across periods", () => {
    expect(flatInterest(500_000, 10, 3)).toBe(150_000);
  });

  it("rounds to nearest integer", () => {
    expect(flatInterest(100_001, 10, 1)).toBe(10_000);
  });

  it("returns 0 for zero principal", () => {
    expect(flatInterest(0, 10, 3)).toBe(0);
  });

  it("throws RangeError for negative principal", () => {
    expect(() => flatInterest(-1, 10, 1)).toThrow(RangeError);
  });

  it("throws RangeError for negative rate", () => {
    expect(() => flatInterest(100_000, -1, 1)).toThrow(RangeError);
  });
});

describe("installmentAmount", () => {
  it("splits total repayable evenly", () => {
    expect(installmentAmount(600_000, 60_000, 3)).toBe(220_000);
  });

  it("rounds up to avoid under-collection", () => {
    // 100,001 / 3 = 33,333.67 → rounds up to 33,334
    expect(installmentAmount(100_001, 0, 3)).toBe(33_334);
  });

  it("throws RangeError when count is zero", () => {
    expect(() => installmentAmount(100_000, 0, 0)).toThrow(RangeError);
  });
});

describe("outstandingBalance", () => {
  it("calculates remaining balance", () => {
    expect(outstandingBalance(100_000, 6, 2)).toBe(400_000);
  });

  it("returns zero when fully paid", () => {
    expect(outstandingBalance(100_000, 6, 6)).toBe(0);
  });

  it("clamps to zero when overpaid", () => {
    expect(outstandingBalance(100_000, 6, 7)).toBe(0);
  });
});

describe("daysOverdue", () => {
  it("returns 0 for a future due date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(daysOverdue(future.toISOString())).toBe(0);
  });

  it("returns correct overdue days for a past date", () => {
    const reference = new Date("2026-06-04T00:00:00Z");
    expect(daysOverdue("2026-05-25T00:00:00Z", reference)).toBe(10);
  });
});

describe("dailyPenalty", () => {
  it("computes penalty for overdue days", () => {
    expect(dailyPenalty(500_000, 1, 5)).toBe(25_000);
  });

  it("returns 0 for zero days", () => {
    expect(dailyPenalty(500_000, 1, 0)).toBe(0);
  });

  it("returns 0 for negative days", () => {
    expect(dailyPenalty(500_000, 1, -1)).toBe(0);
  });
});

describe("totalRepayable", () => {
  it("sums principal and flat interest", () => {
    expect(totalRepayable(500_000, 10, 1)).toBe(550_000);
  });

  it("equals principal when rate is zero", () => {
    expect(totalRepayable(500_000, 0, 3)).toBe(500_000);
  });
});
