import {Guest} from './Guest';
import {BackendEntity} from './BackendEntity';
import {CamperPlaceDto} from '../../api/models/camper-place-dto';

export  interface Reservation extends BackendEntity{
  __type?: 'Reservation';
  id?: number
  checkin: string;
  checkout: string;
  guest?: Guest;
  stringUser?: string;
  camperPlace: CamperPlaceDto;
  camperPlaceIndex?: string;
  price?: number;
  reservationStatus?: string;
  paid: boolean;
 }
