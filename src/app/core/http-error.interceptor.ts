import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../components/feedback/toast/toast.service';

/**
 * GlobalProblemDetail
 * Backend error response structure (RFC 7807 Problem Details for HTTP APIs)
 */
interface GlobalProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  traceId?: string;
  violations?: Array<{ field: string; message: string }>;
  supportReference?: string;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const problem = error.error as GlobalProblemDetail | undefined;

      const title = problem?.title || getStatusTitle(error.status);
      let message = problem?.detail || error.message || 'An unexpected error occurred';

      if (problem?.violations && problem.violations.length > 0) {
        const violations = problem.violations
          .map((v) => `${formatFieldName(v.field)}: ${v.message}`)
          .join(', ');
        message = `${message} (${violations})`;
      }

      if (problem?.supportReference) {
        message += ` [Support Ref: ${problem.supportReference}]`;
      } else if (problem?.traceId) {
        message += ` [Trace ID: ${problem.traceId}]`;
      }

      const duration = getDurationForStatus(error.status);
      toast.error(message, { title, duration });

      if (error.status >= 500) {
        console.error('Server Error:', {
          status: error.status,
          title: problem?.title,
          detail: problem?.detail,
          supportReference: problem?.supportReference,
          traceId: problem?.traceId,
        });
      }

      return throwError(() => error);
    }),
  );
};

function getStatusTitle(status: number): string {
  switch (status) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Validation Error';
    case 500: return 'Server Error';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    default:  return `Error ${status}`;
  }
}

function formatFieldName(fieldName: string): string {
  return fieldName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDurationForStatus(status: number): number {
  if (status >= 500) return 8000;
  if (status === 409 || status === 422) return 6000;
  return 5000;
}
