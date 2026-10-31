import {Injectable} from '@angular/core';
import {ResourceType} from '@core/services/openApiWrappers/service-facade.service';
import {AbstractService} from '@core/services/openApiWrappers/AbstractService';



@Injectable({providedIn: "root"})
export class GuestService extends AbstractService {

  public override getType(): ResourceType {
    return "GUEST" as ResourceType;
  }

}
