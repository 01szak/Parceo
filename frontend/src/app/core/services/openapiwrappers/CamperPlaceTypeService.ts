import {computed, Injectable, ResourceRef} from '@angular/core';
import {PagedCrudService} from '@core/services/openapiwrappers/PagedCrudService';
import { ResourceType } from "./service-facade.service";
import {rxResource} from '@angular/core/rxjs-interop';
import {CamperPlaceTypeDto, findBy2, getTypes} from '../../../api';
import {from} from 'rxjs';

@Injectable({providedIn: "root"})
export class CamperPlaceTypeService extends PagedCrudService {

  public override getType(): ResourceType {
        return ResourceType.CAMPER_PLACE_TYPE;
    }

  private readonly allTypesResource: ResourceRef<CamperPlaceTypeDto[] | undefined> = rxResource({
    params: () => ({}),
    stream: () => from(this.serviceFacade.api.invoke(getTypes))
  });

  //whole types (with ids), for filters that need to send the id
  public getAllTypes = computed<CamperPlaceTypeDto[]>(() => this.allTypesResource.hasValue()
    ? this.allTypesResource.value() ?? []
    : []);

  public getAll =  computed(() => this.allTypesResource.hasValue()
    ? this.allTypesResource.value()?.map(cpt => cpt.typeName) ?? []
    : []);


}
