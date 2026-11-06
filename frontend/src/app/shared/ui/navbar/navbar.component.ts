import {Component, inject, OnInit} from '@angular/core';
import {ThemeService} from '@core/services/ThemeService';
import {Router, RouterLink} from '@angular/router';
import {EmployeeService} from '@core/services/openApiWrappers/EmployeeService';
import {Observable} from 'rxjs';
import {Employee} from '@core/models/Employee';
import {AsyncPipe} from '@angular/common';
import {MatMenu, MatMenuContent, MatMenuTrigger} from '@angular/material/menu';


@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    AsyncPipe,
    MatMenuTrigger,
    MatMenu,
    MatMenuContent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true
})
export class NavbarComponent implements OnInit {

  protected employee$: Observable<Employee | null>;

  constructor(private service: EmployeeService, private router: Router) {
    this.employee$ = service.employee$;
  }

  private readonly theme = inject(ThemeService);

  ngOnInit() {
    this.service.getAppUser().subscribe();
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected logout():void{
    sessionStorage.removeItem('jwtToken');
    this.router.navigate(['/']);
  }

}
