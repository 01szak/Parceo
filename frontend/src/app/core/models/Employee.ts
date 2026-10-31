import {BackendEntity} from './BackendEntity';

export interface Employee extends BackendEntity{
  username: string,
  email: string,
  role: string
}
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  REGULAR = "REGULAR"
}
