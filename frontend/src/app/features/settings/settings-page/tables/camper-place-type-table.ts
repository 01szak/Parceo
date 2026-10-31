import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {CamperPlaceTypeService} from '@core/services/openApiWrappers/CamperPlaceTypeService';
import {PopupFormService} from '@core/services/PopupFormService';
import {Field, RegularTableComponent} from '@shared/ui/data-table/regular-table.component';
import {CamperPlaceTypeDto} from '../../../../api';

@Component({
  selector: 'app-camper-place-type-table',
  standalone: true,
  imports: [RegularTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-regular-table
      [dtoData]="camperPlaceTypeService.pageResource.value().content"
      [isLoading]="camperPlaceTypeService.pageResource.isLoading()"
      [totalElements]="camperPlaceTypeService.pageResource.value().totalElements"
      [tabColumns]="fields"
      [pageableSignal]="camperPlaceTypeService.pageable"
      [searchRequestSignal]="camperPlaceTypeService.searchRequest"
      [onRowClickFunc]="openFormPopup.bind(this)"
      [createFunc]="openFormPopup.bind(this)"
      [displayPaginator]="false"
    />
  `,
})
export class CamperPlaceTypeTable {
  protected camperPlaceTypeService = inject(CamperPlaceTypeService);
  private popupFormService = inject(PopupFormService);

  protected fields: Field[] = [
    {name: 'typeName', displayName: 'Nazwa', type: 'TEXT', value: '', selectOption: this.camperPlaceTypeService.getAll()},
    {name: 'price', displayName: 'Cena', type: 'NUMBER', value: ''},
  ];

  protected openFormPopup(camperPlaceType?: CamperPlaceTypeDto) {
    this.popupFormService.openCamperPlaceTypeFormPopup({camperPlaceType});
  }
}
