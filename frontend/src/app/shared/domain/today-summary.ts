//Polish counting: 1 → one, 2–4 (not 12–14) → few, everything else → many
function plural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}

function guests(count: number): string {
  return `${count} ${plural(count, 'gość', 'gości', 'gości')}`;
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
