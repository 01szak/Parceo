import {Component} from '@angular/core';
import {NavbarComponent} from '@shared/ui/navbar/navbar.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'admin-page',
  imports: [
    NavbarComponent,
    RouterOutlet,
  ],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.css',
  standalone: true
})
export class AdminPageComponent {

}
