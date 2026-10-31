import {inject, Injectable} from '@angular/core';
import {
  Api,
  CamperPlaceDto, CamperPlaceTypeDto,
  create,
  create1,
  create2,
  create3, delete$, delete1, delete2, deleteGuest, findBy2,
  GuestDto,
  Pageable,
  ReservationDto, SearchCriteria,
  SearchRequest, update, update1, update2, update3
} from '../../../api';
import {findBy, findBy1, getTypes} from '../../../api';
import {from, map, Observable} from 'rxjs';
import {Page} from '@core/models/Page';

export type ApiResponse = { [key: string]: string };

export enum ResourceType {
  RESERVATION = 'RESERVATION',
  GUEST = 'GUEST',
  CAMPER_PLACE = "CAMPER_PLACE",
  CAMPER_PLACE_TYPE = "CAMPER_PLACE_TYPE",
}

@Injectable({providedIn: "root"})
export class ServiceFacade {
  public readonly api = inject(Api)

  public findBy(type: ResourceType, pageable?: Pageable | null, body?: SearchRequest): Observable<any> {
    //TODO this should be a static default value
    if (pageable === undefined) {
      pageable = {page: 0, size: 10, sort: []} as Pageable;
    } else if (pageable === null) {
      pageable = undefined; //open api generated the null value as an undefined thus i need to map the null to the undefined cause its easier
    }

    if (body === undefined) body = {searchCriteria: []} as SearchRequest

    const params = {pageable, body};
    switch (type) {
      case ResourceType.RESERVATION: {
        //copy, the body may be a shared signal value / DEFAULT_SEARCH_REQUEST and must not be mutated
        const reservationsWithAssignedStatus: SearchCriteria[] = [
          ...(body.searchCriteria ?? []),
          {
            key: "reservationStatus",
            operation: "NOT_EQUALS",
            value: 'UNVERIFIED',
            joinOperator: "AND"
          } as SearchCriteria,
          {
            key: "reservationStatus",
            operation: "NOT_EQUALS",
            value: 'VERIFIED',
            joinOperator: "AND"
          } as SearchCriteria
        ];
        return from(this.api.invoke(findBy, {...params, body: {searchCriteria: reservationsWithAssignedStatus}}))
      }
      case ResourceType.GUEST: return from(this.api.invoke(findBy1, params));
      case ResourceType.CAMPER_PLACE: return from(this.api.invoke(findBy2, params));
      //the backend has no paged endpoint for the types, the whole list is wrapped into a single page
      case ResourceType.CAMPER_PLACE_TYPE: return from(this.api.invoke(getTypes, {})).pipe(
        map((types): Page<CamperPlaceTypeDto> => ({
          content: types, totalElements: types.length, totalPages: 1, number: 0, size: types.length
        }))
      );
      default: throw new Error(`Provided incorrect resource type: ${type}`);
    }
  }

  create(type: ResourceType, body: GuestDto | ReservationDto | CamperPlaceDto | CamperPlaceTypeDto ): Observable<ApiResponse> {
    switch (type) {
      case ResourceType.RESERVATION: return from(this.api.invoke(create,  {body: body as ReservationDto}))
      case ResourceType.GUEST: return from(this.api.invoke(create1, {body: body as GuestDto}));
      case ResourceType.CAMPER_PLACE: return from(this.api.invoke(create2, {body: body as CamperPlaceDto}));
      case ResourceType.CAMPER_PLACE_TYPE: return from(this.api.invoke(create3,  {body: body as CamperPlaceTypeDto}))
      default: throw new Error(`Provided incorrect resource type: ${type}`);
    }
  }

  update(type: ResourceType, body: GuestDto | ReservationDto | CamperPlaceDto | CamperPlaceTypeDto | CamperPlaceDto[] | CamperPlaceTypeDto[], cpIdToOverride?: number[]): Observable<ApiResponse> {
    const asArray = <T>(b: T | T[]): T[] => Array.isArray(b) ? b : [b];
    switch (type) {
      case ResourceType.RESERVATION: return from(this.api.invoke(update, {body: body as ReservationDto}))
      case ResourceType.GUEST: return from(this.api.invoke(update1, {body: body as GuestDto}));
      case ResourceType.CAMPER_PLACE: return from(this.api.invoke(update2, {body: asArray(body as CamperPlaceDto | CamperPlaceDto[])}));
      case ResourceType.CAMPER_PLACE_TYPE: return from(this.api.invoke(update3, {body: asArray(body as CamperPlaceTypeDto | CamperPlaceTypeDto[]), cpIdToOverride}))
      default: throw new Error(`Provided incorrect resource type: ${type}`);
    }
  }

  delete(type: ResourceType, id: number): Observable<ApiResponse> {
    switch (type) {
      case ResourceType.RESERVATION: return from(this.api.invoke(delete$, {id}))
      case ResourceType.CAMPER_PLACE_TYPE: return from(this.api.invoke(delete1, {cpTypeId: id}));
      case ResourceType.CAMPER_PLACE: return from(this.api.invoke(delete2, {campPlaceId: id}));
      case ResourceType.GUEST: return from(this.api.invoke(deleteGuest, {id}))
      default: throw new Error(`Provided incorrect resource type: ${type}`);
    }
  }

}
