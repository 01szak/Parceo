import {Component, OnInit} from '@angular/core';
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

  ngOnInit() {
    this.service.getAppUser().subscribe();
    this.applyPersistedTheme();
  }

  private applyPersistedTheme(): void {
    const theme = sessionStorage.getItem('theme');
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    }
  }

  protected toggleTheme(): void {
    const isLight = document.body.classList.toggle('light-theme');
    sessionStorage.setItem('theme', isLight ? 'light' : 'dark');
  }

  protected logout():void{
    sessionStorage.removeItem('jwtToken');
    this.router.navigate(['/']);
  }

}
