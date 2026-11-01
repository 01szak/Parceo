import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {MatFormField, MatLabel, MatError, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {Api} from '../../api/api';
import {login} from '../../api/fn/auth-controller/login';
import {SessionService} from '@core/services/SessionService';
import {HOME_PATH} from '@core/guards/auth.guard';
import {ParceoLogoComponent} from '@shared/ui/logo/parceo-logo.component';

interface LoginResponse {
  token?: string;
}

const WRONG_CREDENTIALS = 'Nieprawidłowy login lub hasło.';
const SERVER_UNAVAILABLE = 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj ponownie.';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatSuffix,
    MatInput,
    MatButton,
    MatIconButton,
    MatIcon,
    MatProgressSpinner,
    ParceoLogoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly api = inject(Api);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = new FormGroup({
    login: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly passwordVisible = signal(false);

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      const response = await this.api.invoke(login, {body: this.form.getRawValue()}) as LoginResponse;
      if (!response?.token) throw new Error('Missing token in the login response');
      this.session.setToken(response.token);
      await this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('powrot') ?? `/${HOME_PATH}`);
    } catch (error) {
      this.errorMessage.set(this.messageFor(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private messageFor(error: unknown): string {
    const unreachable = error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
    return unreachable ? SERVER_UNAVAILABLE : WRONG_CREDENTIALS;
  }
}
