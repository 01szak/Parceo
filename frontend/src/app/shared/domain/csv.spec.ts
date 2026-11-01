import {toCsv} from './csv';

describe('toCsv', () => {
  it('joins cells with semicolons and starts with a BOM', () => {
    expect(toCsv(['Gość', 'Kwota'], [['Anna Nowak', '390,00']])).toBe('﻿Gość;Kwota\r\nAnna Nowak;390,00');
  });

  it('quotes cells containing separators, quotes or new lines', () => {
    expect(toCsv(['a'], [['x;y'], ['say "hi"']])).toBe('﻿a\r\n"x;y"\r\n"say ""hi"""');
  });
});
