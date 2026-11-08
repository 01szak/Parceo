export interface NavItem {
  label: string;
  //Material Symbols name
  icon: string;
  path: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  {label: 'Dziś', icon: 'home', path: '/dzis'},
  {label: 'Kalendarz', icon: 'calendar_month', path: '/kalendarz'},
  {label: 'Raporty', icon: 'bar_chart', path: '/raporty'},
];

export const SECONDARY_NAV: readonly NavItem[] = [
  {label: 'Ustawienia', icon: 'settings', path: '/ustawienia'},
];
