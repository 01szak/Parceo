import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition} from '@angular/cdk/overlay';
import {MatDialog} from '@angular/material/dialog';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOptgroup, MatOption, MatSelect} from '@angular/material/select';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatChip, MatChipListbox, MatChipOption, MatChipRemove, MatChipSet} from '@angular/material/chips';
import {MatTooltip} from '@angular/material/tooltip';
import {SaveFilterDialogComponent, SaveFilterDialogData} from './save-filter-dialog.component';

export interface FilterBarView {
  id: string;
  label: string;
}

export interface FilterBarGroup {
  key: string;
  label: string;
  options: readonly { value: string, label: string }[];
}

export type FilterValues = Record<string, string>;

//the value of a group that means "not filtered"
const ANY = 'any';

//above the button first (the table sits low on the page); below it when there is no room above.
//The offset moves the popover away from the button: up when it is above, down when it is below.
const POPOVER_POSITIONS: ConnectedPosition[] = [
  {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8},
  {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8},
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8},
  {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8},
];

/**
 * One "Pokaż" select with built-in views and saved filters, a "Dodaj filtr" popover with filter groups,
 * chips of the applied filters and saving the current combination under a name.
 * Stateless: the parent keeps the view, the filters and the saved filters.
 */
@Component({
  selector: 'app-filter-bar',
  imports: [
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatOptgroup,
    MatButton,
    MatIconButton,
    MatIcon,
    MatChipListbox,
    MatChipOption,
    MatChipSet,
    MatChip,
    MatChipRemove,
    MatTooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
})
export class FilterBarComponent {
  private readonly dialog = inject(MatDialog);

  public readonly views = input.required<readonly FilterBarView[]>();
  public readonly savedViews = input<readonly FilterBarView[]>([]);
  public readonly activeViewId = input.required<string>();
  public readonly groups = input.required<readonly FilterBarGroup[]>();
  public readonly filters = input.required<FilterValues>();
  //"Pokaż rezerwacje" in the popover
  public readonly applyLabel = input('Pokaż wyniki');

  public readonly viewChange = output<string>();
  public readonly filtersChange = output<FilterValues>();
  //the name typed in the save dialog; the parent stores the current view + filters under it
  public readonly saveFilter = output<string>();
  public readonly deleteSavedView = output<string>();

  protected readonly popoverPositions = POPOVER_POSITIONS;
  protected readonly popoverOpen = signal(false);
  protected readonly draft = signal<FilterValues>({});

  protected readonly activeSavedView = computed(() => this.savedViews().find(v => v.id === this.activeViewId()));
  protected readonly activeViewLabel = computed(() =>
    [...this.views(), ...this.savedViews()].find(v => v.id === this.activeViewId())?.label ?? '');

  protected readonly appliedChips = computed(() => this.labelsOf(this.filters()));
  protected readonly hasApplied = computed(() => this.appliedChips().length > 0);
  protected readonly hasDraft = computed(() => this.labelsOf(this.draft()).length > 0);

  protected openPopover(): void {
    this.draft.set({...this.filters()});
    this.popoverOpen.set(true);
  }

  protected closePopover(): void {
    this.popoverOpen.set(false);
  }

  protected pick(key: string, value: string | null): void {
    //a chip listbox emits null when the selected chip is clicked again
    this.draft.update(d => ({...d, [key]: value ?? ANY}));
  }

  protected clearDraft(): void {
    this.draft.set(this.cleared(this.draft()));
  }

  protected apply(): void {
    this.filtersChange.emit(this.draft());
    this.closePopover();
  }

  protected applyAndSave(): void {
    const filters = this.draft();
    this.apply();
    this.askForName(filters);
  }

  protected removeFilter(key: string): void {
    this.filtersChange.emit({...this.filters(), [key]: ANY});
  }

  protected clearAll(): void {
    this.filtersChange.emit(this.cleared(this.filters()));
  }

  protected askForName(filters: FilterValues = this.filters()): void {
    const data: SaveFilterDialogData = {
      summary: [`Widok: ${this.activeViewLabel()}`, ...this.labelsOf(filters).map(c => c.label)],
    };
    this.dialog.open<SaveFilterDialogComponent, SaveFilterDialogData, string>(SaveFilterDialogComponent, {
      data,
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',
    }).afterClosed().subscribe(name => {
      if (name) this.saveFilter.emit(name);
    });
  }

  private labelsOf(filters: FilterValues): { key: string, label: string }[] {
    return this.groups()
      .filter(group => (filters[group.key] ?? ANY) !== ANY)
      .map(group => ({
        key: group.key,
        label: `${group.label}: ${group.options.find(o => o.value === filters[group.key])?.label ?? filters[group.key]}`,
      }));
  }

  private cleared(filters: FilterValues): FilterValues {
    return Object.fromEntries(Object.keys(filters).map(key => [key, ANY]));
  }
}
