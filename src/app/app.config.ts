import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideJwt } from './core/jwt';
import { API_BASE_URL } from './core/api.config';
import { httpErrorInterceptor } from './core/http-error.interceptor';

// Base URL for all API calls — in production point this to your deployed API host.
const API_BASE = 'http://localhost:8080';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // ── API Configuration ───────────────────────────────────────────────────
    { provide: API_BASE_URL, useValue: API_BASE },

    // ── JWT authentication + HTTP client ───────────────────────────────────
    // provideJwt registers HttpClient with functional interceptors.
    // httpErrorInterceptor is passed alongside the JWT interceptor so it runs
    // in the same chain — class-based HTTP_INTERCEPTORS won't work here.
    provideJwt(
      {
        authUrl:    `${API_BASE}/api/auth/login`,
        refreshUrl: `${API_BASE}/api/auth/refresh`,
        logoutUrl:  `${API_BASE}/api/auth/logout`,

        buildPayload: creds => ({
          username: creds['username'],
          password: creds['password'],
        }),

        accessTokenPath: 'access_token',
        refreshToken: { kind: 'cookie' },
        refreshBufferSeconds: 30,
        loginRoute: '/login',
      },
      [httpErrorInterceptor],
    ),
  ],
};
