import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { JwtService } from '../../core/jwt';
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
  private readonly jwt    = inject(JwtService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly error   = signal('');

  protected readonly features = [
    { icon: 'people',      label: 'Centralized employee directory & profiles' },
    { icon: 'school',      label: 'Training tracking & compliance management' },
    { icon: 'event_busy',  label: 'Absence requests & approval workflows' },
    { icon: 'insights',    label: 'Real-time workforce analytics' },
  ];

  protected readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected fillDemo(): void {
    this.form.patchValue({ username: 'zyfit_admin', password: '' });
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set('');
    this.loading.set(true);

    const { username, password } = this.form.value;

    this.jwt.login({ username: username!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        const status = err?.status;
        if (status === 401 || status === 403) {
          this.error.set('Invalid username or password. Please try again.');
        } else if (status === 0) {
          this.error.set('Cannot reach the server. Check your connection and try again.');
        } else {
          this.error.set(`Login failed (${status ?? 'unknown error'}). Please try again.`);
        }
        this.loading.set(false);
      },
    });
  }
}
