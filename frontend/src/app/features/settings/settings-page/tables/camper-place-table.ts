import {ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit} from '@angular/core';
import {CamperPlaceService} from '@core/services/openApiWrappers/CamperPlaceService';
import {PopupFormService} from '@core/services/PopupFormService';
import {Field, RegularTableComponent} from '@shared/ui/data-table/regular-table.component';
import {CamperPlaceDto} from '../../../../api';
import {CamperPlaceTypeService} from '@core/services/openApiWrappers/CamperPlaceTypeService';

@Component({
  selector: 'app-camper-place-settings',
  standalone: true,
  imports: [RegularTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-regular-table
      [dtoData]="camperPlaceService.pageResource.value().content"
      [displayData]="mapToDisplayData()"
      [isLoading]="camperPlaceService.pageResource.isLoading()"
      [totalElements]="camperPlaceService.pageResource.value().totalElements"
      [tabColumns]="fields()"
      [pageableSignal]="camperPlaceService.pageable"
      [searchRequestSignal]="camperPlaceService.searchRequest"
      [onRowClickFunc]="openFormPopup.bind(this)"
      [createFunc]="openFormPopup.bind(this)"
      [resetTableFunction]="onResetFunction"
      [displayPaginator]="false"
    />
  `,
})
export class CamperPlaceTable implements OnInit {
  protected camperPlaceService = inject(CamperPlaceService);
  protected camperPlaceTypeService = inject(CamperPlaceTypeService);
  private popupFormService = inject(PopupFormService);

  protected fields = computed<Field[]>(() => [
    {name: 'index', displayName: 'Indeks', type: 'TEXT', value: '', selectOption: this.camperPlaceService.indexes() },
    {name: 'camperPlaceType', displayName: 'Rodzaj', type: 'OBJECT', innerFields: [{type: 'TEXT', displayName: 'Rodzaj', name: 'typeName', value: '', selectOption: this.camperPlaceTypeService.getAll()}]},
    {name: 'price', displayName: 'Cena', type: 'NUMBER', value: ''},
  ]);

  ngOnInit(): void {
    this.camperPlaceService.resetSignals();
    this.camperPlaceTypeService.resetSignals();
    this.camperPlaceService.pageable.set({sort: ['index', 'ASC'], size: 2147483647, page: 0})
  }

  //TODO this is not triggered
  protected onResetFunction =  () =>
  {this.camperPlaceService.pageable.set({sort: ['index', 'ASC'], size: 2147483647, page: 0})};

  protected mapToDisplayData() {
    return this.camperPlaceService.pageResource.value().content.map(c => {
      const cp = c as CamperPlaceDto;
      return {
        id: cp.id,
        index: cp.index,
        camperPlaceType: cp.camperPlaceType?.typeName ?? '',
        price: cp.price,
      };
    });
  }

  protected openFormPopup(camperPlace?: CamperPlaceDto) {
    this.popupFormService.openCamperPlaceFormPopup({camperPlace});
  }
}
