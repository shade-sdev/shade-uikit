import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { HttpErrorInterceptor } from './core/http-error.interceptor';
import { API_BASE_URL } from './core/api.config';

const API_BASE = 'http://localhost:8080';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // ── API Configuration ───────────────────────────────────────────────────
    { provide: API_BASE_URL, useValue: API_BASE },

    // ── HTTP Configuration ──────────────────────────────────────────────────
    // Provide HttpClient and register global error interceptor
    provideHttpClient(),
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  ],
};
