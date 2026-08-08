import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { syncCommercialScheduleDurationControl } from '../../../../core/factories/commercial-price-editor-form.factory';
import type { CommercialPricedItemEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialCapacityEditor } from './commercial-capacity-editor';
import { CommercialPriceEditor } from './commercial-price-editor';
import { CommercialScheduleEditor } from './commercial-schedule-editor';

@Component({
  selector: 'app-commercial-priced-item-editor',
  imports: [
    ReactiveFormsModule,
    CheckboxModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    CommercialCapacityEditor,
    CommercialPriceEditor,
    CommercialScheduleEditor,
  ],
  templateUrl: './commercial-priced-item-editor.html',
})
export class CommercialPricedItemEditor {
  readonly form = input.required<CommercialPricedItemEditorForm>();
  readonly controlId = input.required<string>();
  readonly priceRequired = input(false);

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected syncPrice(): void {
    setControlEnabled(
      this.form().controls.price,
      this.form().controls.hasPrice.value,
    );
  }

  protected syncCapacity(): void {
    setControlEnabled(
      this.form().controls.capacity,
      this.form().controls.hasCapacity.value,
    );
  }

  protected syncSchedule(): void {
    const form = this.form();
    const enabled = form.controls.hasSchedule.value;

    setControlEnabled(form.controls.schedule, enabled);
    if (enabled) syncCommercialScheduleDurationControl(form.controls.schedule);
  }
}
