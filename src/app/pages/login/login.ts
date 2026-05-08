import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { InputComponent } from '../../components/forms/input/input';
import { ButtonComponent } from '../../components/atoms/button/button';
import { AlertComponent } from '../../components/atoms/alert/alert';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, InputComponent, ButtonComponent, AlertComponent],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly features = [
    { icon: 'people',      label: 'Centralized employee directory & profiles' },
    { icon: 'school',      label: 'Training tracking & compliance management' },
    { icon: 'event_busy',  label: 'Absence requests & approval workflows' },
    { icon: 'insights',    label: 'Real-time workforce analytics' },
  ];

  protected readonly demoCredentials = [
    { label: 'HR Admin',   email: 'admin@corp.io',   password: 'admin123' },
    { label: 'Manager',    email: 'manager@corp.io', password: 'manager123' },
  ];

  protected readonly form = this.fb.group({
    email:    ['admin@corp.io', [Validators.required, Validators.email]],
    password: ['admin123',      [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set('');
    this.loading.set(true);

    setTimeout(() => {
      const { email, password } = this.form.value;
      const ok = this.auth.login(email!, password!);
      if (ok) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set('Invalid email or password. Please try again.');
        this.loading.set(false);
      }
    }, 800);
  }
}
