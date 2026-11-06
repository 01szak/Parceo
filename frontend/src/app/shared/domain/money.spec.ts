import {formatPln} from './money';

describe('formatPln', () => {
  it('uses a space between thousands and a comma before the grosze', () => {
    expect(formatPln(1250)).toBe('1 250,00 zł');
  });

  it('keeps two decimal places', () => {
    expect(formatPln(390.5)).toBe('390,50 zł');
  });

  it('groups larger amounts', () => {
    expect(formatPln(1234567.8)).toBe('1 234 567,80 zł');
  });

  it('keeps the sign of a negative amount', () => {
    expect(formatPln(-40)).toBe('-40,00 zł');
  });
});
