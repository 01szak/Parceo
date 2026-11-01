import {Injectable} from '@angular/core';
import {JwtHelperService} from '@auth0/angular-jwt';

@Injectable({providedIn: 'root'})
export class SessionService {
  private readonly TOKEN_KEY = 'jwtToken';
  private readonly jwt = new JwtHelperService();

  //a stored token that can still be used; a malformed token counts as logged out
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      return !this.jwt.isTokenExpired(token);
    } catch {
      return false;
    }
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  clear(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role || null;
    } catch {
      return null;
    }
  }
}
