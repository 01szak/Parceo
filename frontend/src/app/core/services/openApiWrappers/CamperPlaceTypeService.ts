import {computed, Injectable, ResourceRef} from '@angular/core';
import {AbstractService} from '@core/services/openApiWrappers/AbstractService';
import { ResourceType } from "./service-facade.service";
import {rxResource} from '@angular/core/rxjs-interop';
import {CamperPlaceTypeDto, findBy2, getTypes} from '../../../api';
import {from} from 'rxjs';

@Injectable({providedIn: "root"})
export class CamperPlaceTypeService extends AbstractService {

  public override getType(): ResourceType {
        return ResourceType.CAMPER_PLACE_TYPE;
    }

  private readonly allTypesResource: ResourceRef<CamperPlaceTypeDto[] | undefined> = rxResource({
    params: () => ({}),
    stream: () => from(this.serviceFacade.api.invoke(getTypes))
  });

  public getAll =  computed(() => this.allTypesResource.value()?.map(cpt => cpt.typeName) || []);


}
