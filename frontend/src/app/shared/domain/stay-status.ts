import {ReservationDto} from '../../api';

//what is happening with the guest from the reception's point of view
export type StayStatus = 'arrive' | 'stay' | 'leave' | 'ended' | 'late';

//every chip shown next to a reservation: the stay itself or the separate "unpaid" badge
export type ReservationChipKind = StayStatus | 'unpaid';

export interface ChipMeta {
  label: string;
  icon: string;
  tone: 'arrive' | 'stay' | 'leave' | 'unpaid' | 'late';
}

export const RESERVATION_CHIP_META: Record<ReservationChipKind, ChipMeta> = {
  arrive: {label: 'Przyjazd', icon: 'arrow_forward', tone: 'arrive'},
  stay: {label: 'Aktywna', icon: 'check', tone: 'stay'},
  leave: {label: 'Wyjazd dziś', icon: 'arrow_back', tone: 'leave'},
  ended: {label: 'Zakończona', icon: 'done_all', tone: 'leave'},
  late: {label: 'Po terminie', icon: 'warning', tone: 'late'},
  unpaid: {label: 'Nieopłacona', icon: 'payments', tone: 'unpaid'},
};

export type StayStatusSource = Pick<ReservationDto, 'checkout' | 'reservationStatus' | 'paid'>;

/**
 * Maps the backend status (ACTIVE / COMING / EXPIRED) and the payment flag to the stay status shown in the UI.
 * @param today the current date in the YYYY-MM-DD format (the backend's date format)
 */
export function stayStatus(reservation: StayStatusSource, today: string): StayStatus {
  switch (reservation.reservationStatus) {
    case 'ACTIVE':
      return reservation.checkout === today ? 'leave' : 'stay';
    case 'EXPIRED':
      return reservation.paid ? 'ended' : 'late';
    default:
      //COMING and the web app's UNVERIFIED / VERIFIED reservations are all still ahead
      return 'arrive';
  }
}

//the "unpaid" badge sits next to the stay status, except when the status itself already says so
export function showsUnpaidBadge(reservation: StayStatusSource, today: string): boolean {
  return !reservation.paid && stayStatus(reservation, today) !== 'late';
}
