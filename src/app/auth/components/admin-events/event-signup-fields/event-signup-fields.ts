import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';

import { ContextHelp } from '../../../../common/context-help/context-help';
import { ParticipantSignupKind } from '../../../../core/enums/event';
import { createEventCoreEditorI18n } from '../core-editor/core-editor.i18n';
import { resolveParticipantSignupKindLabel } from '../participant-signup-kind-options';

@Component({
  selector: 'app-event-signup-fields',
  imports: [ReactiveFormsModule, CheckboxModule, RadioButtonModule, ContextHelp],
  templateUrl: './event-signup-fields.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventSignupFields {
  readonly kindControl = input.required<FormControl<ParticipantSignupKind>>();
  readonly requiredControl = input.required<FormControl<boolean>>();
  readonly idPrefix = input.required<string>();
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly kinds = computed(() => [
    { value: ParticipantSignupKind.ProgramItem, icon: 'pi pi-tied-scroll' },
    { value: ParticipantSignupKind.WholeEvent, icon: 'pi pi-knot' },
    { value: ParticipantSignupKind.Both, icon: 'pi pi-cash' },
  ].map(option => ({ ...option,
    label: resolveParticipantSignupKindLabel(option.value, this.i18n.participantKinds()),
    hint: this.i18n.creation().signupKindDescriptions[option.value],
  })));
}
