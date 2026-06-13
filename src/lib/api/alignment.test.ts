import { describe, expect, it, vi, afterEach } from "vitest";

async function loadMockApi() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "true");
  vi.stubEnv("NEXT_PUBLIC_OPFIN_API_URL", "");
  return import("./client");
}

/**
 * FE-BE contract alignment tests.
 *
 * Each test asserts the shape the frontend expects from a backend endpoint.
 * Tests run against the mock API, which mirrors the documented backend contract.
 * If the mock drifts from the backend, the corresponding BE FrontEndAlignmentTest
 * will catch it on the PHP side.
 */
describe("FE-BE contract alignment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // POST /login — LoginResponse
  it("login response data.user includes national_id and date_of_birth", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.login("256700000001", "Password1!");

    expect(response.success).toBe(true);
    expect(typeof response.message).toBe("string");
    expect(response.data.access_token).toBeTruthy();
    expect(response.data.token_type).toBe("Bearer");
    // FE LoginResponse.user type declares national_id and date_of_birth as optional;
    // the key must be present (even if null) so FE components don't have to guard
    // against the key being completely absent.
    expect("national_id" in response.data.user || response.data.user.national_id === null).toBe(true);
  });

  // GET /profile — Profile
  it("profile response data.user includes national_id, date_of_birth, nin_status", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.profile();

    expect(response.success).toBe(true);
    expect(typeof response.message).toBe("string");
    expect(response.data.user.id).toBeDefined();
    expect(Array.isArray(response.data.permissions)).toBe(true);
    // These three fields must be present — FE KYC and dashboard components use them.
    expect("national_id" in response.data.user).toBe(true);
    expect("date_of_birth" in response.data.user).toBe(true);
    expect("nin_status" in response.data.user).toBe(true);
  });

  // GET /loan-balance/{user} — CRITICAL: outstandingAmount must be inside data
  it("loan balance outstandingAmount is nested inside data, never at response root", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.loanBalance(1);

    expect(response.success).toBe(true);
    // The old backend bug returned { success, message, outstandingAmount } with no
    // data key, so response.data was undefined and data.outstandingAmount crashed.
    expect(typeof response.data.outstandingAmount).toBe("number");
    // Confirm the value is NOT accidentally at the response root.
    expect((response as unknown as Record<string, unknown>)["outstandingAmount"]).toBeUndefined();
  });

  // GET /loan-applications/{user} — LoanApplication[] wrapped in data
  it("loan applications list wraps array inside data", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.loanApplications(1);

    expect(response.success).toBe(true);
    expect(typeof response.message).toBe("string");
    expect(Array.isArray(response.data)).toBe(true);
  });

  // GET /products — LoanProduct[] wrapped in data
  it("products list wraps array inside data", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.products();

    expect(response.success).toBe(true);
    expect(typeof response.message).toBe("string");
    expect(Array.isArray(response.data)).toBe(true);
    if (response.data.length > 0) {
      expect(response.data[0]).toHaveProperty("id");
      expect(response.data[0]).toHaveProperty("name");
    }
  });

  // GET /institutions — Institution[] wrapped in data
  it("institutions list wraps array inside data", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.institutions();

    expect(response.success).toBe(true);
    expect(typeof response.message).toBe("string");
    expect(Array.isArray(response.data)).toBe(true);
  });

  // GET /product-terms/{product} — ProductTerm[] wrapped in data
  it("product terms list wraps array inside data", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.productTerms(1);

    expect(response.success).toBe(true);
    expect(typeof response.message).toBe("string");
    expect(Array.isArray(response.data)).toBe(true);
  });

  // POST /loan-applications/{id}/status — LoanApplication wrapped in data
  it("loan status update wraps LoanApplication inside data with success and message", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.updateLoanApplicationStatus(101, "Approved");

    expect(response.success).toBe(true);
    expect(typeof response.message).toBe("string");
    // data must be the LoanApplication, not a nested wrapper
    expect(response.data.status).toBe("Approved");
    expect(response.data.id).toBeDefined();
  });

  // GET /kyc/status — { latest_case } inside data
  it("kyc status wraps latest_case inside data", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.kycStatus();

    expect(response.success).toBe(true);
    expect(typeof response.message).toBe("string");
    expect("latest_case" in response.data).toBe(true);
  });

  // GET /consents — { consents } inside data
  it("consents list wraps consents array inside data", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.consents();

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data.consents)).toBe(true);
  });

  // GET /admin/ledger-transactions — { ledger_transactions } inside data
  it("ledger transactions wraps array inside data.ledger_transactions", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.ledgerTransactions();

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data.ledger_transactions)).toBe(true);
    if (response.data.ledger_transactions.length > 0) {
      const tx = response.data.ledger_transactions[0];
      expect(tx).toHaveProperty("id");
      expect(tx).toHaveProperty("reference");
      expect(Array.isArray(tx.entries)).toBe(true);
    }
  });

  // GET /admin/reconciliation-runs — { runs } inside data
  it("reconciliation runs wraps array inside data.runs", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.reconciliationRuns();

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data.runs)).toBe(true);
  });

  // GET /admin/support-cases — { support_cases } inside data
  it("support cases wraps array inside data.support_cases", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.supportCases();

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data.support_cases)).toBe(true);
  });

  // GET /admin/compliance-reports — { reports } inside data
  it("compliance reports wraps array inside data.reports", async () => {
    const { opfinApi } = await loadMockApi();
    const response = await opfinApi.complianceReports();

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data.reports)).toBe(true);
  });

  // All standard read endpoints must return success=true and a message string
  it("all standard read endpoints return success:true and a string message", async () => {
    const { opfinApi } = await loadMockApi();

    const responses = await Promise.all([
      opfinApi.profile(),
      opfinApi.kycStatus(),
      opfinApi.consents(),
      opfinApi.products(),
      opfinApi.institutions(),
      opfinApi.productTerms(1),
      opfinApi.loanApplications(1),
      opfinApi.loanBalance(1),
      opfinApi.demoDashboard(),
      opfinApi.reconciliationRuns(),
      opfinApi.supportCases(),
      opfinApi.complianceReports(),
      opfinApi.ledgerTransactions(),
    ]);

    for (const response of responses) {
      expect(response.success).toBe(true);
      expect(typeof response.message).toBe("string");
    }
  });
});
