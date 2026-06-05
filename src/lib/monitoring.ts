/* eslint-disable @typescript-eslint/no-explicit-any */

// Optional Sentry integration for production crash visibility.
// Install @sentry/nextjs and set NEXT_PUBLIC_SENTRY_DSN to enable.
// Without either, every call is a safe console fallback.

let _sentry: any = null;
let _initialised = false;

export async function initMonitoring(): Promise<void> {
  if (_initialised) return;
  _initialised = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    // String variable prevents TypeScript and the bundler from statically
    // resolving this optional dep at build time.
    const pkg: string = "@sentry/nextjs";
    const Sentry: any = await import(pkg).catch(() => null);
    if (!Sentry?.init) {
      console.info("[monitoring] NEXT_PUBLIC_SENTRY_DSN set but @sentry/nextjs is not installed.");
      return;
    }
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "production",
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
    _sentry = Sentry;
  } catch {
    console.warn("[monitoring] init failed");
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (_sentry?.captureException) {
    _sentry.captureException(error, context ? { extra: context } : undefined);
  } else {
    console.error("[monitoring] captured error:", error, context ?? "");
  }
}

export function setUser(user: { id: number | string } | null): void {
  if (_sentry?.setUser) {
    _sentry.setUser(user ? { id: String(user.id) } : null);
  }
}
