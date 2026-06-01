import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../components/feedback/toast/toast.service';

/**
 * GlobalProblemDetail
 * Backend error response structure (RFC 7807 Problem Details for HTTP APIs)
 * Example: https://fitnessgym.eyelinkfreelance.com/errors/conflict
 */
interface GlobalProblemDetail {
  /** Error type URI (e.g., "https://fitnessgym.eyelinkfreelance.com/errors/conflict") */
  type?: string;

  /** Error title/code (e.g., "DUPLICATE_ENTRY", "VALIDATION_ERROR") */
  title?: string;

  /** HTTP status code (400, 409, 500, etc.) */
  status?: number;

  /** Human-readable error description */
  detail?: string;

  /** Request URI that caused the error */
  instance?: string;

  /** ISO timestamp when error occurred (format: "yyyy-MM-dd HH:mm:ss:SSS") */
  timestamp?: string;

  /** Trace ID from MDC logging context (for tech support tracking) */
  traceId?: string;

  /** List of validation errors for specific fields */
  violations?: Array<{
    field: string;
    message: string;
  }>;

  /** Support reference ID for internal server errors (e.g., "a1b2c3d4") */
  supportReference?: string;
}

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly toast = inject(ToastService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    const problem = error.error as GlobalProblemDetail | undefined;

    // Determine title
    const title = problem?.title || this.getStatusTitle(error.status);

    // Build message with violations if present
    let message = problem?.detail || error.message || 'An unexpected error occurred';

    // Append field violations
    if (problem?.violations && problem.violations.length > 0) {
      const violations = problem.violations
        .map((v) => `${this.formatFieldName(v.field)}: ${v.message}`)
        .join(', ');
      message = `${message} (${violations})`;
    }

    // Append support reference for internal errors (highest priority)
    if (problem?.supportReference) {
      message += ` [Support Ref: ${problem.supportReference}]`;
    } else if (problem?.traceId) {
      // For other server errors, include trace ID for support
      message += ` [Trace ID: ${problem.traceId}]`;
    }

    // Show appropriate toast based on status
    const duration = this.getDurationForStatus(error.status);
    this.toast.error(message, { title, duration });

    // Log details for debugging
    if (error.status >= 500) {
      console.error('Server Error Details:', {
        status: error.status,
        title: problem?.title,
        detail: problem?.detail,
        type: problem?.type,
        timestamp: problem?.timestamp,
        supportReference: problem?.supportReference,
        traceId: problem?.traceId,
        instance: problem?.instance,
      });
    }

    // Log other errors at warn level
    if (error.status >= 400 && error.status < 500) {
      console.warn('Client Error Details:', {
        status: error.status,
        title: problem?.title,
        detail: problem?.detail,
        violations: problem?.violations,
        instance: problem?.instance,
      });
    }
  }

  private getStatusTitle(status: number): string {
    switch (status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Validation Error';
      case 500:
        return 'Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      default:
        return `Error ${status}`;
    }
  }

  private formatFieldName(fieldName: string): string {
    // Convert contact_number to Contact Number
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private getDurationForStatus(status: number): number {
    // Longer duration for serious errors
    if (status >= 500) return 8000;
    if (status === 409 || status === 422) return 6000;
    return 5000;
  }
}
