import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';

//the backend refuses any request with an invalid bearer token, so logging in never sends the old one
const LOGIN_URL = /\/auth\/login$/;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const jwtToken = sessionStorage.getItem('jwtToken');
    if (!jwtToken || LOGIN_URL.test(request.url)) return next.handle(request);
    return next.handle(request.clone({setHeaders: {Authorization: `Bearer ${jwtToken}`}}));
  }
}
