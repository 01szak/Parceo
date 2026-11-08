import {Directive, inject, input, TemplateRef} from '@angular/core';

export interface CellContext<T> {
  $implicit: T;
}

/**
 * A custom cell of a DataTableComponent column:
 * <ng-template appCell="status" let-row>...</ng-template>
 */
@Directive({selector: 'ng-template[appCell]'})
export class CellDefDirective<T = unknown> {
  //the key of the column this template renders
  public readonly appCell = input.required<string>();
  public readonly template = inject<TemplateRef<CellContext<T>>>(TemplateRef);
}
