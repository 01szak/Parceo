import {previousPeriod, reportPeriod} from './report-period';

describe('report periods', () => {
  const today = '2026-11-01';

  it('names this month and compares it with the previous one', () => {
    const period = reportPeriod('thisMonth', today);
    expect([period.from, period.to, period.phrase, period.comparison])
      .toEqual(['2026-11-01', '2026-12-01', 'W listopadzie', 'w październiku']);
  });

  it('uses "we" before "wrześniu"', () => {
    const october = reportPeriod('lastMonth', today);
    expect([october.phrase, october.comparison]).toEqual(['W październiku', 'we wrześniu']);
  });

  it('wraps around the year', () => {
    const december = reportPeriod('lastMonth', '2026-01-15');
    expect([december.from, december.to, december.phrase]).toEqual(['2025-12-01', '2026-01-01', 'W grudniu']);
    expect(previousPeriod('thisMonth', {from: '2026-01-01', to: '2026-02-01'})).toEqual({from: '2025-12-01', to: '2026-01-01'});
  });

  it('covers the whole year', () => {
    const year = reportPeriod('thisYear', today);
    expect([year.from, year.to, year.phrase, year.comparison]).toEqual(['2026-01-01', '2027-01-01', 'W 2026 roku', 'w 2025 roku']);
    expect(previousPeriod('thisYear', year)).toEqual({from: '2025-01-01', to: '2026-01-01'});
  });

  it('compares custom dates with the same number of days before', () => {
    const custom = reportPeriod('custom', today, {from: '2026-10-01', to: '2026-10-16'});
    expect([custom.phrase, custom.comparison]).toEqual(['Od 01.10 do 15.10', 'w poprzednich 15 dniach']);
    expect(previousPeriod('custom', custom)).toEqual({from: '2026-09-16', to: '2026-10-01'});
  });
});
