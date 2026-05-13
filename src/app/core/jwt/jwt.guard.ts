import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtService } from './jwt.service';
import { JWT_CONFIG } from './jwt.config';

/**
 * Route guard that protects routes requiring a valid JWT session.
 *
 * Usage:
 * ```ts
 * { path: 'dashboard', component: DashboardComponent, canActivate: [jwtGuard] }
 * ```
 */
export const jwtGuard: CanActivateFn = () => {
  const jwt    = inject(JwtService);
  const router = inject(Router);
  const cfg    = inject(JWT_CONFIG);

  if (jwt.isAuthenticated()) return true;

  return router.createUrlTree([cfg.loginRoute ?? '/login']);
};
