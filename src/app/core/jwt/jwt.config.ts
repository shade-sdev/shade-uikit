import { InjectionToken } from '@angular/core';

export type PayloadMap = Record<string, string>;

export interface JwtConfig {
  /** POST endpoint that exchanges credentials for tokens. */
  authUrl: string;

  /** POST endpoint to call when rotating the access token. */
  refreshUrl: string;

  /**
   * Optional POST endpoint called on logout so the server can revoke the session.
   * The current access token is sent automatically via the interceptor.
   * Omit if your backend has no logout endpoint.
   */
  logoutUrl?: string;

  /**
   * Builds the request body for the auth call.
   * Receives the raw credentials object passed to `JwtService.login()`.
   */
  buildPayload: (credentials: Record<string, unknown>) => Record<string, unknown>;

  /**
   * Dot-notation path into the auth/refresh response body where the
   * access token lives, e.g. `"data.accessToken"` or `"accessToken"`.
   */
  accessTokenPath: string;

  /**
   * How the refresh token is delivered:
   * - `{ kind: 'body'; path: string }` — extracted from the response body
   * - `{ kind: 'cookie' }` — arrives as an httpOnly cookie (browser handles automatically)
   */
  refreshToken:
    | { kind: 'body'; path: string }
    | { kind: 'cookie' };

  /**
   * Seconds before the access token expiry at which to proactively refresh.
   * Defaults to 60 (refresh 1 minute early).
   */
  refreshBufferSeconds?: number;

  /**
   * Route to navigate to on logout or unrecoverable 401.
   * Defaults to `'/login'`.
   */
  loginRoute?: string;
}

export const JWT_CONFIG = new InjectionToken<JwtConfig>('JWT_CONFIG');
