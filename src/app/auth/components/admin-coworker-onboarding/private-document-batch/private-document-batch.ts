import { Component, computed, input, output } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { COWORKER_PDF_UPLOAD_OPTIONS } from '../../../../core/configs/coworker-onboarding.config';
import type { IAdminPrivateDocumentUpload } from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { createCoworkerOnboardingI18n } from '../../../../core/translations/coworker-onboarding.i18n';
import { FileUpload } from '../../../../public/common/file-upload/file-upload';

type PrivateDocumentRowForm = FormGroup<{
  preset: FormControl<string | null>;
  title: FormControl<string>;
  requires_signed_upload: FormControl<boolean>;
  file: FormControl<File | null>;
}>;

@Component({
  selector: 'app-private-document-batch',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    FileUpload,
  ],
  templateUrl: './private-document-batch.html',
})
export class PrivateDocumentBatch {
  readonly busy = input(false);
  readonly upload = output<readonly IAdminPrivateDocumentUpload[]>();

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly rows = new FormArray<PrivateDocumentRowForm>([
    this.createRow(),
  ]);
  protected readonly form = new FormGroup({ documents: this.rows });
  protected readonly uploadOptions = computed(() => ({
    ...COWORKER_PDF_UPLOAD_OPTIONS,
    disabled: this.busy(),
  }));
  protected readonly uploadTexts = computed(() => ({
    chooseLabel: this.i18n.upload().choose,
    dropLabel: this.i18n.upload().drop,
    formatsLabel: this.i18n.upload().formats,
  }));
  protected readonly presetOptions = computed(() => [
    {
      value: null,
      label: this.i18n.fields().noPreset,
      title: '',
    },
    {
      value: 'contract',
      label: this.i18n.upload().contractPreset,
      title: this.i18n.upload().contractPreset,
    },
    {
      value: 'annex',
      label: this.i18n.upload().annexPreset,
      title: this.i18n.upload().annexPreset,
    },
    {
      value: 'protocol',
      label: this.i18n.upload().protocolPreset,
      title: this.i18n.upload().protocolPreset,
    },
  ]);

  protected addRow(): void {
    this.rows.push(this.createRow());
  }

  protected removeRow(index: number): void {
    this.rows.removeAt(index);
  }

  protected applyPreset(index: number): void {
    const row = this.rows.at(index);
    const preset = this.presetOptions().find(
      ({ value }) => value === row.controls.preset.value,
    );

    if (preset?.value) {
      row.controls.title.setValue(preset.title);
    }
  }

  protected selectFile(index: number, files: readonly File[]): void {
    this.rows.at(index).controls.file.setValue(files[0] ?? null);
  }

  protected submit(): void {
    this.rows.markAllAsTouched();

    if (this.rows.invalid) {
      return;
    }

    const documents: IAdminPrivateDocumentUpload[] = [];

    for (const row of this.rows.controls) {
      const value = row.getRawValue();

      if (!value.file) {
        return;
      }

      documents.push({
        title: value.title,
        requires_signed_upload: value.requires_signed_upload,
        file: value.file,
      });
    }

    this.upload.emit(documents);
  }

  reset(): void {
    this.rows.clear();
    this.rows.push(this.createRow());
  }

  private createRow(): PrivateDocumentRowForm {
    return new FormGroup({
      preset: new FormControl<string | null>(null),
      title: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      requires_signed_upload: new FormControl(false, { nonNullable: true }),
      file: new FormControl<File | null>(null, Validators.required),
    });
  }
}
