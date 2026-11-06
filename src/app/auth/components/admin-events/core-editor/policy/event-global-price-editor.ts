import { Component, inject } from '@angular/core';

import { EventPriceFields } from '../../event-price-fields/event-price-fields';
import { createEventCoreEditorI18n } from '../core-editor.i18n';
import { EventGlobalPolicyFacade } from './event-global-policy-facade';

@Component({
  selector: 'app-event-global-price-editor',
  imports: [EventPriceFields],
  templateUrl: './event-global-price-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalPriceEditor {
  protected readonly editor = inject(EventGlobalPolicyFacade);
  protected readonly form = this.editor.form.controls.price;
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.priceEditor;
}
