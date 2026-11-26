import { Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormRecord, FormsModule, ReactiveFormsModule, Validators, type ValidatorFn } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { IsoDateValue } from '../../../common/iso-date-value/iso-date-value';
import {
  type ContractField, type ContractTemplateConfiguration, type ContractValue, type ContractValues,
  isTextFieldKind, matchesDecimalPrecision,
} from '../../../core/types/contract-template-configuration';
import { isoDateValidator } from '../../../core/validators/form-value.validator';
import { requiredTrimmedValidator } from '../../../core/validators/required-trimmed.validator';
import { normalizeText } from '../../../core/utils/normalize-text';
import { isValidDate, toIsoDate } from '../../../core/utils/date';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';

@Component({
  selector: 'app-contract-values-form',
  imports: [
    FormsModule, ReactiveFormsModule, ButtonModule, CheckboxModule, DatePickerModule, IftaLabelModule,
    InputNumberModule, InputTextModule, IsoDateValue, SelectModule, TextareaModule,
  ],
  templateUrl: './contract-values-form.html',
})
export class ContractValuesForm {
  readonly configuration = input.required<ContractTemplateConfiguration>();
  readonly busy = input(false);
  readonly formId = input<string | null>(null);
  readonly submitLabel = input<string | null>(null);
  readonly valuesChange = output<void>();
  readonly submitted = output<ContractValues>();

  protected readonly i18n = createAdminContractTemplatesI18n();
  protected readonly form = signal(new FormRecord<FormControl<ContractValue>>({}));
  protected readonly visible = signal<readonly ContractField[]>([]);
  protected readonly standaloneModel = { standalone: true };

  constructor() {
    effect((cleanup) => {
      const fields = this.configuration().fields;
      const form = new FormRecord(Object.fromEntries(fields.map((field) => [
        field.id,
        new FormControl<ContractValue>(emptyValue(field), validators(field)),
      ])));
      this.form.set(form);
      this.syncVisibility(form, fields);
      const subscription = form.valueChanges.subscribe(() => {
        this.syncVisibility(form, fields);
        this.valuesChange.emit();
      });
      cleanup(() => subscription.unsubscribe());
    });
  }

  protected submit(): void {
    const form = this.form();
    form.markAllAsTouched();
    if (this.busy() || form.invalid || !this.visible().length) return;
    this.submitted.emit(Object.fromEntries(this.visible().map(({ id, kind }) => {
      const value = form.controls[id].value;
      return [id, isTextFieldKind(kind) ? normalizeText(value) : value];
    })));
  }

  protected setDate(control: FormControl<ContractValue>, value: unknown): void {
    if (control.disabled) return;
    control.markAsDirty();
    control.setValue(isValidDate(value) ? toIsoDate(value) : null);
  }

  private syncVisibility(form: FormRecord<FormControl<ContractValue>>, fields: readonly ContractField[]): void {
    const shown = new Set<string>();
    for (const field of fields) {
      const control = form.controls[field.id];
      const condition = field.visibleWhen;
      const visible = condition === null || (shown.has(condition.fieldId) &&
        form.controls[condition.fieldId].value === condition.equals);
      if (visible) {
        shown.add(field.id);
        if (control.disabled) control.enable({ onlySelf: true, emitEvent: false });
      } else if (control.enabled) {
        control.reset({ value: emptyValue(field), disabled: true }, { onlySelf: true, emitEvent: false });
      }
    }
    form.updateValueAndValidity({ emitEvent: false });
    this.visible.set(fields.filter(({ id }) => shown.has(id)));
  }
}

function emptyValue(field: ContractField): ContractValue {
  return field.kind === 'checkbox' ? false : null;
}

function validators(field: ContractField): ValidatorFn[] {
  const rules: ValidatorFn[] = [];
  if (field.required) {
    rules.push(field.kind === 'checkbox' ? Validators.requiredTrue :
      isTextFieldKind(field.kind) ? requiredTrimmedValidator() : Validators.required);
  }
  if (field.kind === 'email') rules.push((control) => normalizeText(control.value) === null ? null : Validators.email(control));
  if (field.kind === 'date') rules.push(isoDateValidator());
  if (field.kind === 'select') {
    rules.push(({ value }) => value === null || field.options.some((option) => option.value === value)
      ? null : { option: true });
  }
  const { minLength, maxLength } = field.rules;
  if (minLength !== undefined || maxLength !== undefined) {
    rules.push(({ value }) => {
      const text = normalizeText(value);
      if (text === null) return null;
      const length = [...text].length;
      return (minLength !== undefined && length < minLength) || (maxLength !== undefined && length > maxLength)
        ? { length: true } : null;
    });
  }
  if (field.rules.min !== undefined) rules.push(Validators.min(field.rules.min));
  if (field.rules.max !== undefined) rules.push(Validators.max(field.rules.max));
  if (field.kind === 'integer' || field.kind === 'decimal') {
    const places = field.rules.decimalPlaces ?? 0;
    rules.push(({ value }) => value === null || (typeof value === 'number' && Number.isFinite(value) &&
      matchesDecimalPrecision(value, places)) ? null : { precision: true });
  }
  return rules;
}
