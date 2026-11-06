import {Injectable, ResourceRef, computed, inject} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {Page} from '@core/models/Page';
import { ResourceType } from "./service-facade.service";
import {PagedCrudService} from '@core/services/openApiWrappers/PagedCrudService';
import {safePage} from './page-utils';
import {
  CamperPlaceDto,
  getAvailableCamperPlaces,
  getCalculatedReservationPrice,
  getCamperPlacesWithUniquePriceAndCamperTypeId,
  getOccupiedDates,
  Pageable
} from '../../../api';
import {from, Observable} from 'rxjs';

//a single page big enough to hold every camper place, null (unpaged) can not be combined with sorting
const ALL_SORTED_BY_INDEX: Pageable = {page: 0, size: 2147483647, sort: ['index', 'ASC']};

@Injectable({providedIn: "root"})
export class CamperPlaceService extends PagedCrudService {

  public override getType(): ResourceType {
      return ResourceType.CAMPER_PLACE;
  }

  //independent from the shared pageable / searchRequest signals, so it is not affected by other pages / popups resetting them
  //also reloads after a type change, which can override the prices of its places
  public readonly unpagedCamperPlaceResource: ResourceRef<Page<any>> = rxResource({
    defaultValue: {content: [], number: 0, size: 0, totalElements: 0, totalPages: 0} as Page<any>,
    params: () => ({
      places: this.versions.version(ResourceType.CAMPER_PLACE)(),
      types: this.versions.version(ResourceType.CAMPER_PLACE_TYPE)(),
    }),
    stream: () => this.serviceFacade.findBy(this.getType(), ALL_SORTED_BY_INDEX, {searchCriteria: []})
  });

  public readonly camperPlaces = computed(() => safePage(this.unpagedCamperPlaceResource).content as CamperPlaceDto[]);

  public readonly indexes = computed(() => this.camperPlaces().map(c => c.index!));

  protected override reloadResources() {
    super.reloadResources();
    this.unpagedCamperPlaceResource.reload();
  }

  //camper places with no reservation sharing a night with [from, to); dates in YYYY-MM-DD
  public getAvailable(checkin: string, checkout: string): Observable<CamperPlaceDto[]> {
    return from(this.serviceFacade.api.invoke(getAvailableCamperPlaces, {from: checkin, to: checkout}));
  }

  //future occupancy of a camper place: one list of occupied nights per reservation
  public getOccupiedNights(camperPlaceId: number): Observable<string[][]> {
    return from(this.serviceFacade.api.invoke(getOccupiedDates, {cpId: camperPlaceId}));
  }

  //the price list's total for the stay [checkin, checkout)
  public getPrice(camperPlaceId: number, checkin: string, checkout: string): Observable<number> {
    return from(this.serviceFacade.api.invoke(getCalculatedReservationPrice, {cpId: camperPlaceId, checkin, checkout}));
  }

  // camper places of the given type which have their own price (different from the type's default)
  public getCamperPlacesWithUniquePriceAndCamperTypeId(cptId: number): Observable<CamperPlaceDto[]> {
    return from(this.serviceFacade.api.invoke(getCamperPlacesWithUniquePriceAndCamperTypeId, {typeId: cptId}));
  }

}
