export interface NavItem {
  label: string;
  //Material Symbols name
  icon: string;
  path: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  {label: 'Dziś', icon: 'home', path: '/dzis'},
  {label: 'Kalendarz', icon: 'calendar_month', path: '/kalendarz'},
  //temporary: guests get their own place in the search on the "Dziś" page (step 7 of PLAN.md)
  {label: 'Goście', icon: 'group', path: '/goscie'},
  {label: 'Raporty', icon: 'bar_chart', path: '/raporty'},
];

export const SECONDARY_NAV: readonly NavItem[] = [
  {label: 'Ustawienia', icon: 'settings', path: '/ustawienia'},
];
