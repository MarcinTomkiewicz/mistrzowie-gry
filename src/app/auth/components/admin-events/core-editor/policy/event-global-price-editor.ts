import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

import { EVENT_CURRENCIES, EVENT_PRICE_BASES } from '../../../../../core/configs/events.config';
import { createEventCoreEditorI18n } from '../core-editor.i18n';
import { EventGlobalPolicyFacade } from './event-global-policy-facade';

@Component({
  selector: 'app-event-global-price-editor',
  imports: [ReactiveFormsModule, FloatLabelModule, InputNumberModule, SelectModule],
  templateUrl: './event-global-price-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalPriceEditor {
  protected readonly editor = inject(EventGlobalPolicyFacade);
  protected readonly form = this.editor.form.controls.price;
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.priceEditor;
  protected readonly currencies = [...EVENT_CURRENCIES];
  protected readonly priceBases = computed(() => EVENT_PRICE_BASES.map(value => ({ value, label: this.i18n.priceBases()[value] })));
}
