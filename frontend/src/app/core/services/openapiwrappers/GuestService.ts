import {Injectable} from '@angular/core';
import {ResourceType} from '@core/services/openapiwrappers/service-facade.service';
import {PagedCrudService} from '@core/services/openapiwrappers/PagedCrudService';



@Injectable({providedIn: "root"})
export class GuestService extends PagedCrudService {

  public override getType(): ResourceType {
    return "GUEST" as ResourceType;
  }

}
