import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import {
  CONFIGURATION_LIMITS, CONTRACT_FIELD_KINDS, type ContractField, type ContractFieldKind,
  type ContractFieldRules, type ContractVisibility, isTextFieldKind,
} from '../../../core/types/contract-template-configuration';
import { createCommonValuesI18n } from '../../../core/translations/common.i18n';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';

@Component({
  selector: 'app-contract-field-editor',
  imports: [FormsModule, ButtonModule, CheckboxModule, InputNumberModule, InputTextModule, SelectModule],
  templateUrl: './contract-field-editor.html',
})
export class ContractFieldEditor {
  readonly field = input.required<ContractField>();
  readonly earlier = input.required<readonly ContractField[]>();
  readonly editable = input(true);
  readonly changed = output<ContractField>();
  protected readonly i18n = createAdminContractTemplatesI18n();
  private readonly booleans = createCommonValuesI18n();
  protected readonly limits = CONFIGURATION_LIMITS;
  protected readonly kinds = computed(() => CONTRACT_FIELD_KINDS.map((value) => ({
    value, label: this.i18n.fieldKindLabel(value),
  })));
  protected readonly sources = computed(() => this.earlier().filter((field) =>
    field.kind === 'checkbox' || (field.kind === 'select' && field.options.length > 0)));
  protected readonly conditionOptions = computed(() => {
    const source = this.sources().find(({ id }) => id === this.field().visibleWhen?.fieldId);
    return source?.kind === 'checkbox' ? [
      { value: true, label: this.booleans().yes }, { value: false, label: this.booleans().no },
    ] : source?.options ?? [];
  });
  protected readonly rules = computed((): (keyof ContractFieldRules)[] => {
    const kind = this.field().kind;
    if (isTextFieldKind(kind)) return ['minLength', 'maxLength'];
    if (kind === 'integer') return ['min', 'max'];
    return kind === 'decimal' ? ['min', 'max', 'decimalPlaces'] : [];
  });

  protected patch(patch: Partial<ContractField>): void {
    if (this.editable()) this.changed.emit({ ...this.field(), ...patch });
  }

  protected setKind(kind: ContractFieldKind): void {
    this.patch({ kind, options: [], rules: kind === 'decimal' ? { decimalPlaces: 2 } : {} });
  }

  protected setRule(key: keyof ContractFieldRules, value: number | null): void {
    const rules = { ...this.field().rules };
    if (value === null) delete rules[key];
    else rules[key] = value;
    this.patch({ rules });
  }

  protected condition(fieldId: string | null): void {
    const source = this.sources().find(({ id }) => id === fieldId);
    this.patch({ visibleWhen: source ? {
      fieldId: source.id, equals: source.kind === 'checkbox' ? true : source.options[0].value,
    } : null });
  }

  protected conditionValue(equals: ContractVisibility['equals']): void {
    const source = this.field().visibleWhen;
    if (source) this.patch({ visibleWhen: { ...source, equals } });
  }

  protected addOption(): void {
    const options = this.field().options;
    let sequence = options.length + 1;
    while (options.some(({ value }) => value === 'option_' + sequence)) sequence++;
    this.patch({ options: [...options, { value: 'option_' + sequence, label: '' }] });
  }

  protected optionLabel(index: number, label: string): void {
    this.patch({ options: this.field().options.map((item, position) => position === index ? { ...item, label } : item) });
  }

  protected moveOption(index: number, delta: number): void {
    const options = [...this.field().options];
    const [item] = options.splice(index, 1);
    options.splice(index + delta, 0, item);
    this.patch({ options });
  }

  protected removeOption(index: number): void {
    this.patch({ options: this.field().options.filter((_, position) => position !== index) });
  }
}
