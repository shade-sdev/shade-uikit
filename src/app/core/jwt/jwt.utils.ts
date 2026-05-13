/**
 * Resolve a dot-notation path against an object.
 * e.g. getByPath({ data: { token: 'abc' } }, 'data.token') → 'abc'
 */
export function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Base64url-decode and JSON-parse a JWT payload segment.
 * Does NOT verify the signature — purely for reading claims.
 */
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → binary string → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Extract the `exp` Unix timestamp (seconds) from a decoded payload. */
export function getExpiry(decoded: Record<string, unknown> | null): number | null {
  if (!decoded) return null;
  const exp = decoded['exp'];
  if (typeof exp === 'number') return exp;
  return null;
}

/**
 * Milliseconds remaining until `expSeconds` (Unix timestamp in seconds).
 * Returns a negative number if already expired.
 */
export function msUntilExpiry(expSeconds: number): number {
  return expSeconds * 1000 - Date.now();
}
