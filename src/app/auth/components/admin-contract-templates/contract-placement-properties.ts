import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

import type { ContractField, ContractPlacement } from '../../../core/types/contract-template-configuration';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';

@Component({
  selector: 'app-contract-placement-properties',
  imports: [FormsModule, ButtonModule, CheckboxModule, InputNumberModule, SelectModule],
  templateUrl: './contract-placement-properties.html',
})
export class ContractPlacementProperties {
  readonly placement = input.required<ContractPlacement>();
  readonly field = input<ContractField>();
  readonly fieldLabel = input.required<string>();
  readonly editable = input(false);
  readonly changed = output<ContractPlacement>();
  readonly removed = output<void>();

  protected readonly i18n = createAdminContractTemplatesI18n();
  protected readonly options = computed(() => this.field()?.options ?? []);

  protected font(key: 'sizePt' | 'minSizePt', value: number | null): void {
    const placement = this.placement();
    if (this.editable() && placement.kind === 'text' && value !== null) {
      this.changed.emit({ ...placement, font: { ...placement.font, [key]: value } });
    }
  }

  protected multiline(value: boolean): void {
    const placement = this.placement();
    if (this.editable() && placement.kind === 'text' && this.field()?.kind !== 'multiline') {
      this.changed.emit({ ...placement, multiline: value });
    }
  }

  protected option(value: string): void {
    const placement = this.placement();
    if (this.editable() && placement.kind === 'checkbox' && this.options().some((option) => option.value === value)) {
      this.changed.emit({ ...placement, optionValue: value });
    }
  }
}
