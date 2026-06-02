import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtService } from './jwt.service';
import { JWT_CONFIG } from './jwt.config';

/**
 * Route guard that protects routes requiring a valid JWT session.
 *
 * Usage:
 * ```ts
 * { path: 'dashboard', canActivate: [jwtGuard], loadComponent: ... }
 * ```
 */
export const jwtGuard: CanActivateFn = () => {
  const jwt    = inject(JwtService);
  const router = inject(Router);
  const cfg    = inject(JWT_CONFIG);

  if (jwt.isAuthenticated()) return true;

  return router.createUrlTree([cfg.loginRoute ?? '/login']);
};

/**
 * Route guard that restricts access to users who have at least one of the
 * specified roles. Redirects unauthenticated users to the login route and
 * unauthorised users to `JwtConfig.forbiddenRoute` (defaults to `/dashboard`).
 *
 * Usage:
 * ```ts
 * { path: 'companies', canActivate: [roleGuard('ADMIN', 'HR_MANAGER')], loadComponent: ... }
 * ```
 */
export const roleGuard = (...requiredRoles: string[]): CanActivateFn => () => {
  const jwt    = inject(JwtService);
  const router = inject(Router);
  const cfg    = inject(JWT_CONFIG);

  if (!jwt.isAuthenticated()) {
    return router.createUrlTree([cfg.loginRoute ?? '/login']);
  }

  const userRoles = jwt.roles();
  const hasRole   = requiredRoles.some(r => userRoles.includes(r));

  if (!hasRole) {
    return router.createUrlTree([cfg.forbiddenRoute ?? '/dashboard']);
  }

  return true;
};
