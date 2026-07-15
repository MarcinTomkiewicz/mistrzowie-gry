import { Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

import { Storage } from '../../../../core/services/storage/storage';
import { EventEditionFormGroup } from '../../../../core/types/event-admin-form';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { createEventEditionEditorI18n } from './edition-editor.i18n';

@Component({
  selector: 'app-event-edition-details-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
  ],
  templateUrl: './event-edition-details-editor.html',
})
export class EventEditionDetailsEditor {
  private readonly storage = inject(Storage);

  readonly form = input.required<EventEditionFormGroup>();
  readonly coreName = input.required<string>();
  readonly i18n =
    input.required<ReturnType<typeof createEventEditionEditorI18n>>();

  readonly slugEdited = output<void>();

  protected resolveCoverPreviewUrl(): string | null {
    const control = this.form().controls.coverImagePath;

    return control.invalid
      ? null
      : resolvePublicStorageUrl(this.storage, control.value);
  }
}
