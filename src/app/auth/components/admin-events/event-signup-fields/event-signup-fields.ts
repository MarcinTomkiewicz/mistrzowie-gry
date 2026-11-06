import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ContextHelp } from '../../../../common/context-help/context-help';
import { ParticipantSignupKind } from '../../../../core/enums/event';
import { createEventCoreEditorI18n } from '../core-editor/core-editor.i18n';
import { createParticipantSignupKindOptions } from '../participant-signup-kind-options';

@Component({
  selector: 'app-event-signup-fields',
  imports: [ReactiveFormsModule, SelectModule, ToggleSwitchModule, ContextHelp],
  templateUrl: './event-signup-fields.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventSignupFields {
  readonly kindControl = input.required<FormControl<ParticipantSignupKind>>();
  readonly requiredControl = input.required<FormControl<boolean>>();
  readonly idPrefix = input.required<string>();
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly kinds = computed(() => createParticipantSignupKindOptions(this.i18n.participantKinds()));
}
