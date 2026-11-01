import {ChangeDetectionStrategy, Component, computed, inject, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {BreakpointObserver} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {NgTemplateOutlet} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatDivider} from '@angular/material/divider';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {ParceoLogoComponent} from '@shared/ui/logo/parceo-logo.component';
import {EmployeeService} from '@core/services/openApiWrappers/EmployeeService';
import {SessionService} from '@core/services/SessionService';
import {ThemeMode, ThemeService} from '@core/services/ThemeService';
import {LOGIN_PATH} from '@core/guards/auth.guard';
import {PRIMARY_NAV, SECONDARY_NAV} from './nav-items';

//drawer on a desktop, a narrow rail on a tablet, a bottom bar on a phone
export type ShellLayout = 'drawer' | 'rail' | 'bar';

const DRAWER_QUERY = '(min-width: 1240px)';
const RAIL_QUERY = '(min-width: 600px)';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Administrator systemu',
  ADMIN: 'Właściciel',
  REGULAR: 'Recepcja',
};

const THEME_OPTIONS: readonly { mode: ThemeMode, label: string, icon: string }[] = [
  {mode: 'light', label: 'Jasny', icon: 'light_mode'},
  {mode: 'dark', label: 'Ciemny', icon: 'dark_mode'},
  {mode: 'system', label: 'Jak w systemie', icon: 'contrast'},
];

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    MatIcon,
    MatDivider,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    ParceoLogoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  private readonly employees = inject(EmployeeService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  protected readonly primaryNav = PRIMARY_NAV;
  protected readonly secondaryNav = SECONDARY_NAV;
  protected readonly bottomNav = [...PRIMARY_NAV, ...SECONDARY_NAV];
  protected readonly themeOptions = THEME_OPTIONS;

  protected readonly layout = toSignal(
    inject(BreakpointObserver).observe([DRAWER_QUERY, RAIL_QUERY]).pipe(
      map((state): ShellLayout => state.breakpoints[DRAWER_QUERY] ? 'drawer' : state.breakpoints[RAIL_QUERY] ? 'rail' : 'bar')
    ),
    {initialValue: 'drawer' as ShellLayout}
  );

  protected readonly employee = toSignal(this.employees.employee$, {initialValue: null});
  protected readonly roleLabel = computed(() => {
    const role = this.employee()?.role;
    return role ? ROLE_LABELS[role] ?? role : '';
  });
  protected readonly initials = computed(() => (this.employee()?.username ?? '?').slice(0, 2).toUpperCase());

  ngOnInit(): void {
    this.employees.getAppUser().subscribe();
  }

  protected logout(): void {
    this.session.clear();
    this.router.navigate([LOGIN_PATH]);
  }
}
