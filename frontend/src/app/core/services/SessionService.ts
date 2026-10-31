import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class SessionService {
  private readonly TOKEN_KEY = 'jwtToken';

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
