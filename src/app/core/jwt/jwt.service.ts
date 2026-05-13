import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { JWT_CONFIG, JwtConfig } from './jwt.config';
import { decodeJwt, getByPath, getExpiry, msUntilExpiry } from './jwt.utils';

const STORAGE_ACCESS_KEY  = 'jwt_access';
const STORAGE_REFRESH_KEY = 'jwt_refresh';
const STORAGE_DECODED_KEY = 'jwt_decoded';

@Injectable({ providedIn: 'root' })
export class JwtService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cfg = inject<JwtConfig>(JWT_CONFIG);

  // ── Public signals ────────────────────────────────────────────────────────

  /** `true` when a valid, non-expired access token is present. */
  readonly isAuthenticated = signal(false);

  /** Decoded JWT payload — persisted in localStorage, survives page reload. */
  readonly decodedToken = signal<Record<string, unknown> | null>(null);

  // ── Internal ──────────────────────────────────────────────────────────────
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    this.clearRefreshTimer();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * POST credentials to `authUrl`, store the returned tokens, schedule
   * proactive rotation, and flip `isAuthenticated` to true.
   */
  login(credentials: Record<string, unknown>): Observable<unknown> {
    const payload = this.cfg.buildPayload(credentials);
    return this.http
      .post<unknown>(this.cfg.authUrl, payload, { withCredentials: true })
      .pipe(tap(res => this.applyTokenResponse(res)));
  }

  /**
   * Optionally call the backend logout endpoint, then clear all local state
   * and navigate to the login route.
   *
   * Safe to call even when already logged out.
   */
  logout(): void {
    const logoutUrl = this.cfg.logoutUrl;

    const doCleanup = () => {
      this.clearStorage();
      this.clearRefreshTimer();
      this.isAuthenticated.set(false);
      this.decodedToken.set(null);
      this.router.navigate([this.loginRoute]);
    };

    if (logoutUrl) {
      // Fire-and-forget — clean up locally regardless of server response
      this.http
        .post(logoutUrl, {}, { withCredentials: true })
        .subscribe({ complete: doCleanup, error: doCleanup });
    } else {
      doCleanup();
    }
  }

  /**
   * POST to `refreshUrl` and store the rotated access token.
   * The interceptor calls this on a 401 with an expired token.
   */
  refresh(): Observable<unknown> {
    const body =
      this.cfg.refreshToken.kind === 'body'
        ? { refreshToken: sessionStorage.getItem(STORAGE_REFRESH_KEY) }
        : {}; // httpOnly cookie is sent automatically

    return this.http
      .post<unknown>(this.cfg.refreshUrl, body, { withCredentials: true })
      .pipe(tap(res => this.applyTokenResponse(res)));
  }

  /** Read a single claim from the decoded payload. */
  getClaim<T = unknown>(claim: string): T | undefined {
    return (this.decodedToken()?.[claim] as T | undefined);
  }

  /** Raw access token string (used by the interceptor). */
  getAccessToken(): string | null {
    return sessionStorage.getItem(STORAGE_ACCESS_KEY);
  }

  /**
   * Called by `provideJwt`'s app initializer before any route is activated.
   *
   * - If a valid (non-expired) token is in sessionStorage → restore immediately.
   * - If the token is expired and the refresh strategy is cookie-based → attempt
   *   a silent refresh so the user stays logged in across hard reloads.
   * - Otherwise clear storage and resolve to `false` (guard will redirect to login).
   */
  restoreSession(): Observable<boolean> {
    const token = sessionStorage.getItem(STORAGE_ACCESS_KEY);
    if (!token) return of(false);

    const decoded = decodeJwt<Record<string, unknown>>(token);
    const exp = getExpiry(decoded);

    // Token still valid
    if (exp === null || msUntilExpiry(exp) > 0) {
      this.applyDecoded(decoded);
      this.isAuthenticated.set(true);
      this.scheduleRefresh(decoded);
      return of(true);
    }

    // Token expired — attempt silent refresh if we can
    const canSilentRefresh =
      this.cfg.refreshToken.kind === 'cookie' ||
      (this.cfg.refreshToken.kind === 'body' &&
        !!sessionStorage.getItem(STORAGE_REFRESH_KEY));

    if (canSilentRefresh) {
      return this.refresh().pipe(
        map(() => true),
        catchError(() => {
          this.clearStorage();
          return of(false);
        }),
      );
    }

    this.clearStorage();
    return of(false);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private get loginRoute(): string {
    return this.cfg.loginRoute ?? '/login';
  }

  private get bufferMs(): number {
    return (this.cfg.refreshBufferSeconds ?? 60) * 1000;
  }

  /**
   * Extract tokens from a login/refresh response, write to storage,
   * update signals, and schedule the next proactive refresh.
   */
  private applyTokenResponse(response: unknown): void {
    const accessToken = getByPath(response, this.cfg.accessTokenPath);
    if (typeof accessToken !== 'string' || !accessToken) {
      console.error('[JwtService] Access token not found at path:', this.cfg.accessTokenPath);
      return;
    }

    sessionStorage.setItem(STORAGE_ACCESS_KEY, accessToken);

    if (this.cfg.refreshToken.kind === 'body') {
      const rt = getByPath(response, this.cfg.refreshToken.path);
      if (typeof rt === 'string' && rt) {
        sessionStorage.setItem(STORAGE_REFRESH_KEY, rt);
      }
    }

    const decoded = decodeJwt<Record<string, unknown>>(accessToken);
    this.applyDecoded(decoded);
    this.isAuthenticated.set(true);
    this.scheduleRefresh(decoded);
  }

  private applyDecoded(decoded: Record<string, unknown> | null): void {
    if (!decoded) return;
    localStorage.setItem(STORAGE_DECODED_KEY, JSON.stringify(decoded));
    this.decodedToken.set(decoded);
  }

  /**
   * Schedule a proactive refresh so the access token is rotated before it
   * expires, giving a seamless experience without any 401s.
   */
  private scheduleRefresh(decoded: Record<string, unknown> | null): void {
    this.clearRefreshTimer();
    const exp = getExpiry(decoded);
    if (exp === null) return;

    const delay = msUntilExpiry(exp) - this.bufferMs;
    if (delay <= 0) {
      this.refresh().subscribe({ error: () => this.logout() });
      return;
    }

    this.refreshTimer = setTimeout(
      () => this.refresh().subscribe({ error: () => this.logout() }),
      delay,
    );
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private clearStorage(): void {
    sessionStorage.removeItem(STORAGE_ACCESS_KEY);
    sessionStorage.removeItem(STORAGE_REFRESH_KEY);
    localStorage.removeItem(STORAGE_DECODED_KEY);
  }
}
