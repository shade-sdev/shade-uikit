import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideJwt } from './core/jwt';
import { API_BASE_URL } from './core/api.config';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpErrorInterceptor } from './core/http-error.interceptor';

// Base URL for all API calls — in production point this to your deployed API host.
const API_BASE = 'http://localhost:8080';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // ── API Configuration ───────────────────────────────────────────────────
    { provide: API_BASE_URL, useValue: API_BASE },

    // ── JWT authentication ──────────────────────────────────────────────────
    // This also registers HttpClient + the Bearer-token interceptor internally.
    // Do NOT add a separate provideHttpClient() call.
    provideJwt({
      authUrl:    `${API_BASE}/api/auth/login`,
      refreshUrl: `${API_BASE}/api/auth/refresh`,
      logoutUrl:  `${API_BASE}/api/auth/logout`,

      // Map login-form credentials to what the backend expects.
      buildPayload: creds => ({
        username: creds['username'],
        password: creds['password'],
      }),

      // Backend returns: { "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 900 }
      accessTokenPath: 'access_token',

      // The refresh token is delivered as an httpOnly cookie named "refreshToken".
      // The browser sends it automatically on every POST to /api/auth/refresh.
      refreshToken: { kind: 'cookie' },

      // Proactively rotate the access token 2 min before it expires.
      // Fires at 13 min for a 15-min token, leaving room for network latency.
      refreshBufferSeconds: 30,

      loginRoute: '/login',
    }),

    // ── HTTP Error Handling ─────────────────────────────────────────────────
    // Global interceptor for handling all HTTP errors.
    // Registered AFTER provideJwt() so it's added to the JWT-provided HttpClient chain.
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  ],
};
