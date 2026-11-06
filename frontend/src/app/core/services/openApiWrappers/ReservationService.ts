import {Injectable} from '@angular/core';
import {PagedCrudService} from '@core/services/openApiWrappers/PagedCrudService';
import {ResourceType} from '@core/services/openApiWrappers/service-facade.service';

//create / update / delete of reservations; lists are built with createPagedQuery() by the pages that show them
@Injectable({providedIn: "root"})
export class ReservationService extends PagedCrudService {

  public override getType(): ResourceType {
      return ResourceType.RESERVATION;
  }

}
