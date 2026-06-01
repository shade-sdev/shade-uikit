import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { JWT_CONFIG, JwtConfig } from './jwt.config';
import { jwtInterceptor } from './jwt.interceptor';
import { JwtService } from './jwt.service';

/**
 * Drop-in provider for the full JWT authentication package.
 *
 * Place this in your `app.config.ts` providers array **instead of** a separate
 * `provideHttpClient()` call — this function registers HttpClient internally
 * with the JWT interceptor already wired in.
 *
 * ```ts
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(routes),
 *     provideJwt({
 *       authUrl:         'https://api.example.com/api/auth/login',
 *       refreshUrl:      'https://api.example.com/api/auth/refresh',
 *       logoutUrl:       'https://api.example.com/api/auth/logout',
 *       buildPayload:    creds => ({ username: creds['username'], password: creds['password'] }),
 *       accessTokenPath: 'accessToken',
 *       refreshToken:    { kind: 'cookie' },
 *       refreshBufferSeconds: 60,
 *       loginRoute: '/login',
 *     }),
 *   ],
 * };
 * ```
 */
export function provideJwt(config: JwtConfig, extraInterceptors: HttpInterceptorFn[] = []): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: JWT_CONFIG, useValue: config },

    // Register HttpClient with the JWT interceptor and any extra interceptors.
    // Do NOT call provideHttpClient() separately in app.config.ts.
    provideHttpClient(withInterceptors([jwtInterceptor, ...extraInterceptors])),

    // Restore session BEFORE any route guard runs.
    // - If token is valid       → marks isAuthenticated = true
    // - If token is expired     → attempts a silent refresh (cookie flow)
    // - If refresh fails / none → clears storage; guard redirects to login
    provideAppInitializer(() => {
      const jwt = inject(JwtService);
      return firstValueFrom(jwt.restoreSession());
    }),
  ]);
}
