import {inject, Injectable, ResourceRef, signal} from '@angular/core';
import {ApiResponse, ResourceType, ServiceFacade} from '@core/services/openApiWrappers/service-facade.service';
import {NotificationService} from '@core/services/NotificationService';
import {CamperPlaceDto, CamperPlaceTypeDto, GuestDto, Pageable, ReservationDto, SearchRequest} from '../../../api';
import {Page} from '@core/models/Page';
import {rxResource} from '@angular/core/rxjs-interop';
import {tap} from 'rxjs';
import {DEFAULT_PAGEABLE, DEFAULT_SEARCH_REQUEST} from '@shared/ui/data-table/regular-table.component';

@Injectable({providedIn: "root"})
export abstract class AbstractService {
  protected readonly serviceFacade = inject(ServiceFacade);
  protected readonly notification = inject(NotificationService);
  //null is used to get unpaged data
  public readonly pageable = signal<Pageable | undefined | null>(undefined);
  public readonly searchRequest = signal<SearchRequest | undefined>(undefined);

  public abstract getType(): ResourceType;

  public pageResource: ResourceRef<Page<any>> = rxResource({
    defaultValue: {content: [], number: 0, size: 0, totalElements: 0, totalPages: 0} as Page<any>,
    params: () => {return {pageable: this.pageable(), searchCriteria: this.searchRequest()}},
    stream: ({params}) => {
      return this.serviceFacade.findBy(this.getType(), params.pageable, params.searchCriteria)
    }
  })

  public create(body: GuestDto | ReservationDto | CamperPlaceDto | CamperPlaceTypeDto) {
    return this.serviceFacade.create(this.getType(), body).pipe(this.notifyAndReload());
  }

  public update(body: GuestDto | ReservationDto | CamperPlaceDto | CamperPlaceTypeDto | CamperPlaceDto[] | CamperPlaceTypeDto[], cpIdToOverride?: number[]) {
    return this.serviceFacade.update(this.getType(), body, cpIdToOverride).pipe(this.notifyAndReload());
  }

  public delete(id: number) {
    return this.serviceFacade.delete(this.getType(), id).pipe(this.notifyAndReload());
  }

  public resetSignals() {
    this.pageable.set(DEFAULT_PAGEABLE);
    this.searchRequest.set(DEFAULT_SEARCH_REQUEST)
  }

  //subclasses owning additional resources (e.g. unpaged ones) override this to refresh them as well
  protected reloadResources() {
    this.pageResource.reload();
  }

  private notifyAndReload() {
    return tap<ApiResponse>({
      next: (response) => {
        this.reloadResources();
        this.notification.success(response);
      },
      error: (error) => this.notification.error(error)
    });
  }
}
