import {Injectable} from '@angular/core';
import {ResourceType} from '@core/services/openApiWrappers/service-facade.service';
import {PagedCrudService} from '@core/services/openApiWrappers/PagedCrudService';



@Injectable({providedIn: "root"})
export class GuestService extends PagedCrudService {

  public override getType(): ResourceType {
    return "GUEST" as ResourceType;
  }

}
