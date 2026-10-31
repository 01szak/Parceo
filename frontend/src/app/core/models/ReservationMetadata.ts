export interface ReservationMetadata {
  reserved: string[],
  checkin: string[],
  checkout: string[],
}
export interface ReservationMetadataWithSets {
  reserved: Set<string>;
  checkin: Set<string>;
  checkout: Set<string>;
}
