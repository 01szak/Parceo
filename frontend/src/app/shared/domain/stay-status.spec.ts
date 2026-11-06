import {showsUnpaidBadge, stayStatus, StayStatusSource} from './stay-status';

describe('stayStatus', () => {
  const today = '2026-10-31';
  const reservation = (overrides: Partial<StayStatusSource>): StayStatusSource =>
    ({checkout: '2026-11-03', reservationStatus: 'ACTIVE', paid: true, ...overrides});

  it('treats a coming reservation as an arrival', () => {
    expect(stayStatus(reservation({reservationStatus: 'COMING'}), today)).toBe('arrive');
  });

  it('treats unverified web reservations as arrivals', () => {
    expect(stayStatus(reservation({reservationStatus: 'UNVERIFIED'}), today)).toBe('arrive');
  });

  it('treats an active reservation as a stay', () => {
    expect(stayStatus(reservation({}), today)).toBe('stay');
  });

  it('treats an active reservation ending today as a departure', () => {
    expect(stayStatus(reservation({checkout: today}), today)).toBe('leave');
  });

  it('treats a paid expired reservation as ended', () => {
    expect(stayStatus(reservation({reservationStatus: 'EXPIRED'}), today)).toBe('ended');
  });

  it('treats an unpaid expired reservation as late', () => {
    expect(stayStatus(reservation({reservationStatus: 'EXPIRED', paid: false}), today)).toBe('late');
  });
});

describe('showsUnpaidBadge', () => {
  const today = '2026-10-31';

  it('shows the badge for an unpaid stay', () => {
    expect(showsUnpaidBadge({checkout: '2026-11-03', reservationStatus: 'ACTIVE', paid: false}, today)).toBeTrue();
  });

  it('hides the badge when the status already says "late"', () => {
    expect(showsUnpaidBadge({checkout: '2026-10-20', reservationStatus: 'EXPIRED', paid: false}, today)).toBeFalse();
  });

  it('hides the badge for a paid reservation', () => {
    expect(showsUnpaidBadge({checkout: '2026-11-03', reservationStatus: 'ACTIVE', paid: true}, today)).toBeFalse();
  });
});
