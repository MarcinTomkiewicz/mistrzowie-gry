import { Component, computed, effect, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { COMMERCIAL_CONSTANT_VALUE_TYPES } from '../../../../core/configs/commercial-pages.config';
import {
  changeCommercialConstantDurationUnit,
  changeCommercialConstantValueType,
  createCommercialConstantEditorForm,
  mapCommercialConstantEditorForm,
  resetCommercialConstantEditorForm,
} from '../../../../core/factories/commercial-constant-editor-form.factory';
import type { CommercialConstantAdminItem } from '../../../../core/types/commercial-constant-admin';
import type {
  CommercialConstantDurationUnit,
  CommercialConstantEditorSave,
} from '../../../../core/types/commercial-constant-editor-form';
import { createAdminCommercialConstantsI18n } from '../admin-commercial-constants.i18n';

@Component({
  selector: 'app-commercial-constant-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './commercial-constant-editor.html',
})
export class CommercialConstantEditor {
  readonly visible = input(false);
  readonly constant = input<CommercialConstantAdminItem | null>(null);
  readonly saving = input(false);

  readonly visibleChange = output<boolean>();
  readonly save = output<CommercialConstantEditorSave>();

  protected readonly i18n = createAdminCommercialConstantsI18n();
  protected readonly form = createCommercialConstantEditorForm();
  protected readonly isEditing = computed(() => this.constant() !== null);
  protected readonly valueTypeOptions = computed(() => {
    const labels = this.i18n.valueType();

    return COMMERCIAL_CONSTANT_VALUE_TYPES.map((value) => ({
      value,
      label: labels[value],
    }));
  });

  constructor() {
    effect(() => {
      this.visible();
      resetCommercialConstantEditorForm(this.form, this.constant());
    });
  }

  protected onVisibleChange(visible: boolean): void {
    if (!this.saving()) {
      this.visibleChange.emit(visible);
    }
  }

  protected changeValueType(): void {
    changeCommercialConstantValueType(this.form);
  }

  protected setDurationUnit(unit: CommercialConstantDurationUnit): void {
    changeCommercialConstantDurationUnit(this.form, unit);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit({
      constantId: this.constant()?.id ?? null,
      payload: mapCommercialConstantEditorForm(this.form),
    });
  }
}
