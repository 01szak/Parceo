import {Reservation} from './Reservation';

export interface CamperPlace {
  id: number
  index: string;
  reservations: Reservation[]
}

