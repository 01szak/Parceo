import {countLabel} from './plural';

describe('countLabel', () => {
  it('declines Polish nouns', () => {
    expect(countLabel(1, 'parcela', 'parcele', 'parcel')).toBe('1 parcela');
    expect(countLabel(3, 'parcela', 'parcele', 'parcel')).toBe('3 parcele');
    expect(countLabel(5, 'parcela', 'parcele', 'parcel')).toBe('5 parcel');
    expect(countLabel(13, 'parcela', 'parcele', 'parcel')).toBe('13 parcel');
    expect(countLabel(24, 'parcela', 'parcele', 'parcel')).toBe('24 parcele');
    expect(countLabel(0, 'parcela', 'parcele', 'parcel')).toBe('0 parcel');
  });
});
