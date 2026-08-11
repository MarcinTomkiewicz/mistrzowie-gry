import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_ACTUAL_COST_BASES,
  COMMERCIAL_BILLING_UNITS,
  COMMERCIAL_PERCENTAGE_BASES,
  COMMERCIAL_PRICE_TYPES,
} from '../../../../core/configs/commercial-pages.config';
import type { CommercialPriceEditorForm } from '../../../../core/types/commercial-price-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-price-editor',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './commercial-price-editor.html',
})
export class CommercialPriceEditor {
  readonly form = input.required<CommercialPriceEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly priceTypeOptions = computed(() => {
    const labels = this.i18n.priceType();

    return COMMERCIAL_PRICE_TYPES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly billingUnitOptions = computed(() => {
    const labels = this.i18n.billingUnit();

    return COMMERCIAL_BILLING_UNITS.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly percentageBasisOptions = computed(() => {
    const labels = this.i18n.percentageBasis();

    return COMMERCIAL_PERCENTAGE_BASES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly actualCostBasisOptions = computed(() => {
    const labels = this.i18n.actualCostBasis();

    return COMMERCIAL_ACTUAL_COST_BASES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
}
