import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ParticipantSignupKind } from '../../../../core/enums/event';
import { ISelectOption } from '../../../../core/interfaces/i-select-option';
import { EventEditionFormGroup } from '../../../../core/types/event-admin-form';
import { createEventEditionEditorI18n } from './edition-editor.i18n';

@Component({
  selector: 'app-event-edition-settings-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
  ],
  templateUrl: './event-edition-settings-editor.html',
})
export class EventEditionSettingsEditor {
  readonly form = input.required<EventEditionFormGroup>();
  readonly i18n =
    input.required<ReturnType<typeof createEventEditionEditorI18n>>();

  protected readonly participantSignupKindOptions = computed<
    ISelectOption<ParticipantSignupKind>[]
  >(() => [
    {
      value: ParticipantSignupKind.WholeEvent,
      label: this.i18n().participantKinds().wholeEvent,
    },
    {
      value: ParticipantSignupKind.ProgramItem,
      label: this.i18n().participantKinds().programItem,
    },
    {
      value: ParticipantSignupKind.Both,
      label: this.i18n().participantKinds().both,
    },
  ]);
}
