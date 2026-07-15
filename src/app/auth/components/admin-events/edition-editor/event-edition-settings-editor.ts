import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { EventEditionFormGroup } from '../../../../core/types/event-admin-form';
import { createParticipantSignupKindOptions } from '../../../../core/utils/event-admin';
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

  protected readonly participantSignupKindOptions = computed(() =>
    createParticipantSignupKindOptions(this.i18n().participantKinds()),
  );
}
