import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { catchError, Observable, share, switchMap, throwError } from 'rxjs';
import { JwtService } from './jwt.service';
import { JWT_CONFIG } from './jwt.config';
import { decodeJwt, getExpiry, msUntilExpiry } from './jwt.utils';

/**
 * In-flight refresh observable shared across concurrent 401s so only one
 * refresh HTTP call is ever made at a time.
 */
let pendingRefresh$: Observable<unknown> | null = null;

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const jwt = inject(JwtService);
  const cfg = inject(JWT_CONFIG);

  // Skip the auth / refresh / logout calls themselves
  const isAuthCall =
    req.url === cfg.authUrl ||
    req.url === cfg.refreshUrl ||
    (cfg.logoutUrl ? req.url === cfg.logoutUrl : false);

  // Attach Bearer token to all other outgoing requests
  const token = jwt.getAccessToken();
  const outgoing =
    token && !isAuthCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthCall) {
        return handle401(err, req, next, jwt);
      }
      return throwError(() => err);
    }),
  );
};

/**
 * 401 strategy:
 *
 * 1. Inspect the current access token's `exp` claim.
 * 2. If the token IS expired → the 401 is due to expiry → try refresh + retry.
 * 3. If the token is still valid (or there's no token) → the server is
 *    genuinely rejecting us (revoked, wrong permissions, etc.) → logout immediately.
 *
 * This prevents pointless refresh attempts when the user is actually unauthorised.
 */
function handle401(
  originalError: HttpErrorResponse,
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  jwt: JwtService,
): Observable<HttpEvent<unknown>> {
  const token = jwt.getAccessToken();

  if (token) {
    const decoded = decodeJwt(token);
    const exp = getExpiry(decoded);
    const tokenExpired = exp !== null && msUntilExpiry(exp) <= 0;

    if (tokenExpired) {
      return refreshAndRetry(originalError, originalReq, next, jwt);
    }
  }

  // Token valid or absent → not an expiry issue → go to login
  jwt.logout();
  return throwError(() => originalError);
}

function refreshAndRetry(
  originalError: HttpErrorResponse,
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  jwt: JwtService,
): Observable<HttpEvent<unknown>> {
  if (!pendingRefresh$) {
    pendingRefresh$ = jwt.refresh().pipe(
      share(), // deduplicate concurrent 401s into a single HTTP call
    );
    pendingRefresh$.subscribe({
      complete: () => { pendingRefresh$ = null; },
      error:    () => { pendingRefresh$ = null; },
    });
  }

  return pendingRefresh$.pipe(
    switchMap(() => {
      const newToken = jwt.getAccessToken();
      const retryReq = newToken
        ? originalReq.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
        : originalReq;
      return next(retryReq);
    }),
    catchError(() => {
      jwt.logout();
      return throwError(() => originalError);
    }),
  );
}
