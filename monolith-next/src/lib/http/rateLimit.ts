import { UnauthorizedError } from "@/lib/http/errors";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

export function enforceLoginRateLimit(key: string, maxAttempts = 8, windowMs = 60_000): void {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (existing.count >= maxAttempts) {
    throw new UnauthorizedError("Demasiados intentos de inicio de sesión.");
  }

  existing.count += 1;
}
