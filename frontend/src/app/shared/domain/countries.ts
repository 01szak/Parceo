import {COUNTRIES, Country} from '@shared/constants/COUNTRIES';

//the guest's country is a Country picked from the list or the ISO code kept by the backend
export type CountryValue = Country | string | null | undefined;

export function countryByIso(isoCode: string): Country | undefined {
  return COUNTRIES.find(c => c.isoCode.toLowerCase() === isoCode.toLowerCase());
}

export function countryName(value: CountryValue): string {
  if (!value) return '';
  return typeof value === 'string' ? countryByIso(value)?.name ?? value : value.name;
}

export function countryIso(value: CountryValue): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.isoCode;
}

export function filterCountries(query: CountryValue): Country[] {
  const text = (typeof query === 'string' ? query : query?.name ?? '').toLowerCase();
  return COUNTRIES.filter(c => c.name.toLowerCase().includes(text));
}
