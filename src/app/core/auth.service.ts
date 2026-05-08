import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

const CREDENTIALS = [
  { email: 'admin@corp.io',   password: 'admin123',  name: 'Patrick Lee',    role: 'HR Manager' },
  { email: 'manager@corp.io', password: 'manager123',name: 'Alice Martin',   role: 'Engineering Lead' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  private readonly _user = signal<AuthUser | null>(this.loadStored());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = () => this._user() !== null;

  login(email: string, password: string): boolean {
    const match = CREDENTIALS.find((c) => c.email === email && c.password === password);
    if (!match) return false;
    const user: AuthUser = { name: match.name, email: match.email, role: match.role };
    this._user.set(user);
    localStorage.setItem('auth-user', JSON.stringify(user));
    return true;
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem('auth-user');
    this.router.navigate(['/login']);
  }

  private loadStored(): AuthUser | null {
    try {
      const raw = localStorage.getItem('auth-user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
