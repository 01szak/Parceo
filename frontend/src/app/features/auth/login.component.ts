import {Component, EventEmitter, inject, input, Output} from '@angular/core';
import {MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import {MatInput} from '@angular/material/input';
import {MatCard, MatCardContent} from '@angular/material/card';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {FormButtonsComponent} from '@shared/ui/buttons/form-buttons.component';
import {Api} from '../../api/api';
import {login} from '../../api/fn/auth-controller/login';
import {LoginRequest} from '../../api/models/login-request';
import {SessionService} from '@core/services/SessionService';

@Component({
  selector: 'app-login',
  imports: [
    MatFormField,
    FormsModule,
    MatInput,
    MatHint,
    MatLabel,
    MatCard,
    MatCardContent,
    CommonModule,
    RouterModule,
    FormButtonsComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: true
})
export class LoginComponent {
  private api = inject(Api);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  @Output() onSubmitLoginEvent = new EventEmitter();
  @Output() onSubmitRegisterEvent = new EventEmitter();

  active: string = "login";
  isLogged: boolean = false;
  errorMessage: string = "";

  onLoginTab(): void {
    this.active = 'login';
  }

  request: LoginRequest = {
    login: '',
    password: ''
  }

  login = () => {
    this.onSubmitLoginEvent.emit({"login": this.request.login, "password": this.request.password});
    this.api.invoke(login, { body: this.request }).then(
      (response: any) => {
        if (response && response.token) {
          this.sessionService.setToken(response.token);
          this.isLogged = true;
          this.router.navigate(["/admin-page/calendar"]);
        }
      },
      (error) => {
        this.errorMessage = "Wrong login or password";
        console.error(error);
      }
    );
  }

  onRegisterTab(): void {
    this.active = 'register';
  }

  protected readonly input = input;
}
