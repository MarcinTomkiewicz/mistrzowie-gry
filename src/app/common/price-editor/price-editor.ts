import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import {
  ACTUAL_COST_BASES,
  BILLING_UNITS,
  PERCENTAGE_BASES,
  PRICE_TYPES,
} from '../../core/configs/price.config';
import { createCommonPriceI18n } from '../../core/translations/common.i18n';
import type { PriceEditorForm } from '../../core/types/price-editor-form';

@Component({
  selector: 'app-price-editor',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './price-editor.html',
})
export class PriceEditor {
  readonly form = input.required<PriceEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createCommonPriceI18n();
  protected readonly priceTypeOptions = computed(() => {
    const labels = this.i18n().editor.types;

    return PRICE_TYPES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly billingUnitOptions = computed(() => {
    const labels = this.i18n().editor.billingUnits;

    return BILLING_UNITS.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly percentageBasisOptions = computed(() => {
    const labels = this.i18n().editor.percentageBases;

    return PERCENTAGE_BASES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly actualCostBasisOptions = computed(() => {
    const labels = this.i18n().editor.actualCostBases;

    return ACTUAL_COST_BASES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
}
