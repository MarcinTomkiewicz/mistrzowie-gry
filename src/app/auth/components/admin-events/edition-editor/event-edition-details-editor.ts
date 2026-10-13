import { Component, inject, input, output, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

import { ImageUpload } from '../../../../common/image-upload/image-upload';
import { Storage } from '../../../../core/services/storage/storage';
import { EventEditionFormGroup } from '../../../../core/types/event-admin-form';
import { FileUploadImageChange } from '../../../../core/types/file-upload';
import { createEventEditionEditorI18n } from './edition-editor.i18n';

@Component({
  selector: 'app-event-edition-details-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    ImageUpload,
  ],
  templateUrl: './event-edition-details-editor.html',
})
export class EventEditionDetailsEditor {
  private readonly storage = inject(Storage);
  private readonly imageUpload = viewChild(ImageUpload);

  readonly form = input.required<EventEditionFormGroup>();
  readonly coreName = input.required<string>();
  readonly isNew = input.required<boolean>();
  readonly disabled = input(false);
  readonly coverChanged = output<FileUploadImageChange>();
  readonly i18n =
    input.required<ReturnType<typeof createEventEditionEditorI18n>>();

  resetCoverSelection(): void {
    this.imageUpload()?.resetSelection();
  }

  protected resolveCoverPreviewUrl(): string | null {
    const control = this.form().controls.coverImagePath;

    return control.invalid
      ? null
      : this.storage.getPublicUrl(control.value, 'images');
  }
}
