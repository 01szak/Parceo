import {toCsv} from './csv';

describe('toCsv', () => {
  it('joins cells with semicolons and starts with a BOM', () => {
    expect(toCsv(['Gość', 'Kwota'], [['Anna Nowak', '390,00']])).toBe('﻿Gość;Kwota\r\nAnna Nowak;390,00');
  });

  it('quotes cells containing separators, quotes or new lines', () => {
    expect(toCsv(['a'], [['x;y'], ['say "hi"']])).toBe('﻿a\r\n"x;y"\r\n"say ""hi"""');
  });

  it('stops text cells from running as formulas in Excel', () => {
    expect(toCsv(['a'], [['=HYPERLINK("x")'], ['+A1'], ['@SUM(A1)'], ['-cmd']]))
      .toBe('﻿a\r\n"\'=HYPERLINK(""x"")"\r\n\'+A1\r\n\'@SUM(A1)\r\n\'-cmd');
  });

  it('leaves numbers alone, also negative and formatted ones', () => {
    expect(toCsv(['a', 'b', 'c'], [[-3, '-12,50', '1 250,00']])).toBe('﻿a;b;c\r\n-3;-12,50;1 250,00');
  });
});
