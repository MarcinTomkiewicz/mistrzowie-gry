import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-core-editions',
  imports: [RouterLink, ButtonModule],
  templateUrl: './event-core-editions.html',
  host: { class: 'd-block w-100' },
})
export class EventCoreEditions {
  readonly core = input.required<IEventCoreDetail>();
  readonly legacyEditing = input.required<boolean>();
  protected readonly i18n = createEventCoreEditorI18n();
}
