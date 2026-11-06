import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule, type FormControl } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

import { EVENT_CURRENCIES, EVENT_PRICE_BASES } from '../../../../core/configs/events.config';
import type { EventCurrency, EventPriceBasis } from '../../../../core/interfaces/i-admin-global-event';
import { createEventCoreEditorI18n } from '../core-editor/core-editor.i18n';

@Component({
  selector: 'app-event-price-fields',
  imports: [ReactiveFormsModule, InputNumberModule, SelectModule],
  templateUrl: './event-price-fields.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventPriceFields {
  readonly amount = input.required<FormControl<number | null>>();
  readonly currency = input.required<FormControl<EventCurrency>>();
  readonly basis = input.required<FormControl<EventPriceBasis | null> | FormControl<EventPriceBasis>>();
  readonly idPrefix = input.required<string>();
  readonly amountError = input.required<string>();
  readonly basisInvalid = input(false);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly currencies = [...EVENT_CURRENCIES];
  protected readonly priceBases = computed(() => EVENT_PRICE_BASES.map(value => ({ value, label: this.i18n.priceBases()[value] })));
}
