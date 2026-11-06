import {HttpHandler, HttpRequest} from '@angular/common/http';
import {of} from 'rxjs';

import {AuthInterceptor} from './auth.interceptor';

describe('AuthInterceptor', () => {
  const interceptor = new AuthInterceptor();
  let forwarded: HttpRequest<unknown> | undefined;
  const handler: HttpHandler = {
    handle: (req) => {
      forwarded = req;
      return of();
    }
  };

  afterEach(() => {
    sessionStorage.removeItem('jwtToken');
    forwarded = undefined;
  });

  it('adds the bearer token when the user is logged in', () => {
    sessionStorage.setItem('jwtToken', 'abc');
    interceptor.intercept(new HttpRequest('GET', '/api/user'), handler).subscribe();
    expect(forwarded?.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('leaves the request untouched without a token', () => {
    interceptor.intercept(new HttpRequest('GET', '/api/user'), handler).subscribe();
    expect(forwarded?.headers.has('Authorization')).toBeFalse();
  });

  it('does not send an old token with the login request', () => {
    sessionStorage.setItem('jwtToken', 'expired');
    interceptor.intercept(new HttpRequest('POST', 'http://localhost:8080/auth/login', {}), handler).subscribe();
    expect(forwarded?.headers.has('Authorization')).toBeFalse();
  });
});
