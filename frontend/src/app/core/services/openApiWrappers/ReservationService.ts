import {Injectable} from '@angular/core';
import {AbstractService} from '@core/services/openApiWrappers/AbstractService';
import {ResourceType} from '@core/services/openApiWrappers/service-facade.service';

//create / update / delete of reservations; lists are built with createPagedQuery() by the pages that show them
@Injectable({providedIn: "root"})
export class ReservationService extends AbstractService {

  public override getType(): ResourceType {
      return ResourceType.RESERVATION;
  }

}
