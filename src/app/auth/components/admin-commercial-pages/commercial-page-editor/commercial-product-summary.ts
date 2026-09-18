import { Component, input } from '@angular/core';
import { FormArray } from '@angular/forms';

import { PriceValue } from '../../../../common/price-value/price-value';
import {
  formatCommercialCooperationLength,
  formatCommercialFrequency,
} from '../../../../core/domain/commercial-pages/commercial-product-fields';
import { mapCommercialProductEditorForm } from '../../../../core/factories/commercial-product-editor-form.factory';
import { createCommercialPageI18n } from '../../../../core/translations/commercial-pages.i18n';
import type { CommercialConstantAdminItem } from '../../../../core/types/commercial-constant-admin';
import type { CommercialEditorProduct } from '../../../../core/types/commercial-product';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { formatDuration } from '../../../../core/utils/duration-format';
import {
  formatNumber,
  formatOptionalNumberRange,
} from '../../../../core/utils/number-format';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-product-summary',
  imports: [PriceValue],
  templateUrl: './commercial-product-summary.html',
})
export class CommercialProductSummary {
  readonly product = input.required<CommercialProductEditorForm>();
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly constants = input<readonly CommercialConstantAdminItem[]>([]);
  readonly locale = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly commercialI18n = createCommercialPageI18n();

  protected productValue(): CommercialEditorProduct {
    return mapCommercialProductEditorForm(this.product(), 0);
  }

  protected productFrequency(product: CommercialEditorProduct): string {
    return formatCommercialFrequency(
      product.frequency,
      this.commercialI18n.productValues(),
      this.i18n.commonValues().notApplicable,
      this.locale(),
    );
  }

  protected productCooperationLength(
    product: CommercialEditorProduct,
  ): string {
    return formatCommercialCooperationLength(
      product.cooperationLength,
      this.commercialI18n.productValues(),
      this.i18n.commonValues().notApplicable,
      this.locale(),
    );
  }

  protected productDuration(): string {
    const mode = this.product().controls.durationMode.getRawValue();

    if (mode === 'not_applicable') {
      return this.i18n.commonValues().notApplicable;
    }

    const minutes = mode === 'standard'
      ? this.numericConstant('duration', 'duration')
      : this.product().controls.durationMinutes.getRawValue();

    return minutes === null
      ? this.i18n.commonValues().notAvailable
      : formatDuration(
          minutes,
          this.commercialI18n.productValues().duration,
          this.locale(),
        );
  }

  protected productParticipants(): string {
    const controls = this.product().controls;
    const mode = controls.participantsMode.getRawValue();

    if (mode === 'not_applicable') {
      return this.i18n.commonValues().notApplicable;
    }

    if (mode === 'standard') {
      const value = this.numericConstant('participants', 'integer');
      return value === null
        ? this.i18n.commonValues().notAvailable
        : this.formatParticipants(null, value);
    }

    return this.formatParticipants(
      controls.participantsMin.getRawValue(),
      controls.participantsMax.getRawValue(),
      controls.participantsPerFacilitatorMax.getRawValue(),
    );
  }

  protected productSessions(): string {
    const controls = this.product().controls;
    const mode = controls.sessionsMode.getRawValue();

    if (mode === 'not_applicable') {
      return this.i18n.commonValues().notApplicable;
    }

    const count = controls.sessionsCount.getRawValue();
    if (count === null) return this.i18n.commonValues().notAvailable;

    return `${this.i18n.sessionMode()[mode]}: ${formatNumber(
      count,
      this.locale(),
    )}`;
  }

  protected productIncludedAddons(): string | null {
    const controls = this.product().controls;
    if (controls.kind.getRawValue() === 'addon') return null;

    const addonIds = controls.includedAddonIds.getRawValue();
    if (!addonIds.length) return null;

    return addonIds.map((addonId) => {
      const addon = this.products().controls.find((candidate) =>
        candidate.controls.id.getRawValue() === addonId &&
        candidate.controls.kind.getRawValue() === 'addon'
      );

      if (!addon) {
        throw new TypeError(`Missing page-local commercial addon: ${addonId}`);
      }

      return addon.controls.name.getRawValue();
    }).join(', ');
  }

  private formatParticipants(
    min: number | null,
    max: number | null,
    perFacilitatorMax: number | null = null,
  ): string {
    const range = formatOptionalNumberRange(
      min,
      max,
      this.i18n.commonLabels().fromLowercase,
      this.i18n.commonLabels().toLowercase,
      this.locale(),
    );
    const perFacilitator = formatOptionalNumberRange(
      perFacilitatorMax,
      perFacilitatorMax,
      this.i18n.commonLabels().fromLowercase,
      this.i18n.commonLabels().toLowercase,
      this.locale(),
    );

    if (!perFacilitator) {
      return range ?? this.i18n.commonValues().notAvailable;
    }

    const summary =
      `${this.i18n.product().participantsPerFacilitatorMax}: ${perFacilitator}`;

    return range ? `${range}; ${summary}` : summary;
  }

  private numericConstant(
    token: string,
    valueType: 'duration' | 'integer',
  ): number | null {
    const constant = this.constants().find(
      (candidate) =>
        candidate.token === token && candidate.valueType === valueType,
    );

    return constant && typeof constant.draftValue === 'number'
      ? constant.draftValue
      : null;
  }
}
