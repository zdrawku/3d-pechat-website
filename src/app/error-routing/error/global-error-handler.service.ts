import { ErrorHandler, Injectable } from '@angular/core';

/**
 * Global error handler.
 *
 * Previously this navigated the user to `/error` on ANY uncaught error. That was
 * both a UX problem (a transient script hiccup blanked the whole page) and it
 * aborted Lighthouse audits (the page changed URL mid-run). We now log the error
 * — and report it to Google Analytics when available — but never auto-navigate,
 * so a non-fatal error no longer takes down the current view.
 */
@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {

  handleError(error: any): void {
    console.error(error);

    // Best-effort telemetry: report the error to GA if gtag is present.
    const gtag = (globalThis as any)?.gtag;
    if (typeof gtag === 'function') {
      try {
        gtag('event', 'exception', {
          description: String(error?.message ?? error),
          fatal: false
        });
      } catch {
        // never let error reporting throw from the error handler
      }
    }
  }
}
