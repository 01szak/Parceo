import {Injectable} from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import {catchError, from, Observable, of, switchMap, throwError} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * Interceptor to automatically convert Blobs with 'application/json' type back to JSON objects.
 */
@Injectable()
export class BlobJsonInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      switchMap(event => {
        const contentType = event instanceof HttpResponse
        && event.body instanceof Blob? (event.body.type || '').toLowerCase() : '';
        if (
          event instanceof HttpResponse
          && event.body instanceof Blob
          && (contentType.includes('application/json') || contentType.endsWith('+json'))
        ) {
          return from(event.body.text()).pipe(
            map(text => {
                try {
                    return event.clone({ body: JSON.parse(text) });
                } catch (e) {
                    return event;
                }
            })
          );
        }
        return of(event);
      }),
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
          return from(error.error.text()).pipe(
            switchMap(text => {
              let parsedError = text;
              try {
                parsedError = JSON.parse(text);
              } catch (e) {
              }

              const clonedError = new HttpErrorResponse({
                error: parsedError,
                headers: error.headers,
                status: error.status,
                statusText: error.statusText,
                url: error.url || undefined
              });

              return throwError(() => clonedError);
            })
          );
        }

        return throwError(() => error);
      })
    );
  }
}
