import {countLabel, plural} from './plural';

function guests(count: number): string {
  return countLabel(count, 'gość', 'gości', 'gości');
}

//"Dziś przyjeżdża 4 gości i wyjeżdża 3."
export function arrivalsSentence(arrivals: number, departures: number): string {
  if (arrivals === 0 && departures === 0) return 'Dziś nikt nie przyjeżdża ani nie wyjeżdża.';
  if (departures === 0) return `Dziś przyjeżdża ${guests(arrivals)}.`;
  if (arrivals === 0) return `Dziś wyjeżdża ${guests(departures)}.`;
  return `Dziś przyjeżdża ${guests(arrivals)} i wyjeżdża ${departures}.`;
}

//"2 rezerwacje czekają na zapłatę."
export function unpaidSentence(count: number): string {
  if (count === 0) return 'Wszystkie rezerwacje są opłacone.';
  const noun = plural(count, 'rezerwacja czeka', 'rezerwacje czekają', 'rezerwacji czeka');
  return `${count} ${noun} na zapłatę.`;
}
