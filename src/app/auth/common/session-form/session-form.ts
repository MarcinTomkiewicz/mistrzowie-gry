import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import {
  createSessionForm,
  mapSessionFormToPayload,
  mapSessionToFormData,
} from '../../../core/factories/session-form.factory';
import { IChipPickerOption } from '../../../core/interfaces/i-chip-picker';
import { IContentTrigger } from '../../../core/interfaces/i-content-trigger';
import { IGmStyle } from '../../../core/interfaces/i-gm-style';
import { ILanguage } from '../../../core/interfaces/i-languages';
import {
  ISessionFormInitialData,
  ISessionFormSubmitData,
} from '../../../core/interfaces/i-session';
import { ISystem } from '../../../core/interfaces/i-system';
import type { IPdfPreview } from '../../../core/interfaces/i-pdf';
import { Storage } from '../../../core/services/storage/storage';
import {
  NewSessionCharacterSheet,
  SessionCharacterSheetCard,
} from '../../../core/types/session-character-sheet';
import {
  SESSION_DIFFICULTY_LEVEL_OPTIONS,
  SessionDifficultyLevel,
} from '../../../core/types/sessions';
import { resolveLanguageFlagClass } from '../../../core/utils/language';
import { normalizeText } from '../../../core/utils/normalize-text';
import { setControlValue } from '../../../core/utils/form-controls';
import { ChipPicker } from '../../../common/chip-picker/chip-picker';
import { FileUpload } from '../../../common/file-upload/file-upload';
import { PdfThumbnail } from '../../../common/pdf-thumbnail/pdf-thumbnail';
import { PdfViewerDialog } from '../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { SystemAutocomplete } from '../../../common/system-autocomplete/system-autocomplete';
import { createSessionFormI18n } from './session-form.i18n';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    ChipPicker,
    FileUpload,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    PdfThumbnail,
    PdfViewerDialog,
    SelectModule,
    SystemAutocomplete,
    TextareaModule,
  ],
  templateUrl: './session-form.html',
  providers: [provideTranslocoScope('sessions', 'common')],
})
export class SessionForm {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(Storage);

  readonly initial = input<ISessionFormInitialData | null>(null);
  readonly systems = input<readonly ISystem[]>([]);
  readonly styles = input<readonly IGmStyle[]>([]);
  readonly triggers = input<readonly IContentTrigger[]>([]);
  readonly languages = input<readonly ILanguage[]>([]);
  readonly submitLabel = input('');
  readonly cancelLabel = input('');
  readonly busy = input(false);

  readonly save = output<ISessionFormSubmitData>();
  readonly cancel = output<void>();

  readonly i18n = createSessionFormI18n();
  readonly form = createSessionForm(this.fb);

  readonly selectedImageFile = signal<File | null>(null);
  readonly storedImagePath = signal<string | null>(null);
  readonly removedCharacterSheetIds = signal<string[]>([]);
  readonly newCharacterSheetFiles = signal<readonly NewSessionCharacterSheet[]>([]);
  readonly characterSheetPreview = signal<IPdfPreview | null>(null);

  readonly styleOptions = computed<IChipPickerOption[]>(() =>
    this.styles().map((style) => ({
      id: style.id,
      label: style.label,
      searchText: style.slug,
      selectedClassName: 'tag-badge--arcane',
      unselectedClassName: 'tag-badge--muted',
    })),
  );

  readonly triggerOptions = computed<IChipPickerOption[]>(() =>
    this.triggers().map((trigger) => ({
      id: trigger.id,
      label: trigger.label,
      searchText: `${trigger.slug} ${trigger.aliases.join(' ')}`.trim(),
      selectedClassName: 'tag-badge--ember',
      unselectedClassName: 'tag-badge--muted',
    })),
  );

  readonly languageOptions = computed<IChipPickerOption[]>(() =>
    [...this.languages()]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((language) => ({
        id: language.id,
        label: language.label,
        searchText: `${language.code} ${language.label} ${language.flagCode}`,
        iconClassName: resolveLanguageFlagClass(language.flagCode) ?? '',
        selectedClassName: 'tag-badge--arcane',
        unselectedClassName: 'tag-badge--muted',
      })),
  );

  readonly difficultyLabels = computed<Record<SessionDifficultyLevel, string>>(
    () => {
      const difficulty = this.i18n.difficulty();

      return Object.fromEntries(
        SESSION_DIFFICULTY_LEVEL_OPTIONS.map((option) => [
          option.value,
          option.value === 'beginner'
            ? this.i18n.commonLabels().forBeginners
            : difficulty[option.i18nKey],
        ]),
      ) as Record<SessionDifficultyLevel, string>;
    },
  );

  readonly difficultyOptions = computed(() =>
    SESSION_DIFFICULTY_LEVEL_OPTIONS.map((option) => ({
      value: option.value,
      label: this.difficultyLabels()[option.value],
    })),
  );

  readonly storedImageUrl = computed(() => {
    if (this.selectedImageFile()) {
      return null;
    }

    return this.storage.getPublicUrl(this.storedImagePath());
  });

  readonly existingCharacterSheets = computed(() => {
    const removedIds = new Set(this.removedCharacterSheetIds());

    return (this.initial()?.characterSheets ?? []).filter(
      (sheet) => !removedIds.has(sheet.id),
    );
  });

  readonly characterSheetItems = computed<readonly SessionCharacterSheetCard[]>(() => [
    ...this.existingCharacterSheets().map((sheet) => ({
      id: sheet.id,
      fileName: sheet.fileName,
      previewUrl: this.storage.getPublicUrl(sheet.storagePath, 'docs'),
      kind: 'existing' as const,
    })),
    ...this.newCharacterSheetFiles().map((sheet) => ({
      ...sheet,
      fileName: sheet.file.name,
      kind: 'new' as const,
    })),
  ]);

  constructor() {
    effect(() => {
      this.removedCharacterSheetIds.set([]);
      this.replaceNewCharacterSheetFiles([]);
      this.selectedImageFile.set(null);
      this.storedImagePath.set(normalizeText(this.initial()?.image));
      this.characterSheetPreview.set(null);
      this.form.reset(mapSessionToFormData(this.initial()));
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });

    this.destroyRef.onDestroy(() => {
      this.replaceNewCharacterSheetFiles([]);
    });
  }

  onSystemSelect(system: ISystem | null): void {
    setControlValue(this.form.controls.systemId, system?.id ?? null);
  }

  onSystemClear(): void {
    setControlValue(this.form.controls.systemId, null);
  }

  onStylesChange(gmStyleIds: string[]): void {
    setControlValue(this.form.controls.gmStyleIds, gmStyleIds);
  }

  onTriggersChange(triggerIds: string[]): void {
    setControlValue(this.form.controls.triggerIds, triggerIds);
  }

  onLanguagesChange(languageIds: string[]): void {
    setControlValue(this.form.controls.languageIds, languageIds);
  }

  onImageValueChange(file: File | null): void {
    this.selectedImageFile.set(file);

    if (!file) {
      setControlValue(this.form.controls.image, this.storedImagePath(), false);
      return;
    }

    setControlValue(this.form.controls.image, file.name);
  }

  onReadyCharacterSheetsChange(checked: boolean): void {
    if (!checked) {
      this.clearCharacterSheets();
      setControlValue(this.form.controls.hasReadyCharacterSheets, false);
      return;
    }

    setControlValue(this.form.controls.hasReadyCharacterSheets, true);
    this.syncCharacterSheetsCount();
  }

  onCharacterSheetsSelected(files: File[] | FileList | readonly File[]): void {
    const selectedFiles = Array.from(files).filter((file) => this.isPdfFile(file));

    if (!selectedFiles.length) {
      return;
    }

    this.replaceNewCharacterSheetFiles([
      ...this.newCharacterSheetFiles(),
      ...selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    setControlValue(this.form.controls.hasReadyCharacterSheets, true);
    this.syncCharacterSheetsCount();
  }

  removeCharacterSheet(item: SessionCharacterSheetCard): void {
    if (item.kind === 'existing') {
      this.removedCharacterSheetIds.update((ids) => [
        ...new Set([...ids, item.id]),
      ]);
    } else {
      this.replaceNewCharacterSheetFiles(
        this.newCharacterSheetFiles().filter((sheet) => sheet.id !== item.id),
      );
    }

    this.form.markAsDirty();
    this.syncCharacterSheetsCount();
  }

  clearCharacterSheets(): void {
    const existingIds = this.existingCharacterSheets().map((sheet) => sheet.id);

    if (existingIds.length) {
      this.removedCharacterSheetIds.update((ids) => [...new Set([...ids, ...existingIds])]);
    }

    this.replaceNewCharacterSheetFiles([]);
    this.syncCharacterSheetsCount(0);
    this.form.markAsDirty();
  }

  openCharacterSheetPreview(url: string | null, title: string): void {
    if (!url) {
      return;
    }

    this.characterSheetPreview.set({
      title,
      url,
    });
  }

  closeCharacterSheetPreview(): void {
    this.characterSheetPreview.set(null);
  }

  onSubmit(): void {
    this.syncCharacterSheetsCount();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit({
      payload: mapSessionFormToPayload(this.form),
      imageFile: this.selectedImageFile(),
      persistedImagePath: this.storedImagePath(),
      newCharacterSheetFiles: this.newCharacterSheetFiles().map(
        (sheet) => sheet.file,
      ),
      removedCharacterSheetIds: this.removedCharacterSheetIds(),
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  showControlError(
    controlName: keyof typeof this.form.controls,
    errorKeys: readonly string[],
  ): boolean {
    const control = this.form.controls[controlName];

    return control.touched && errorKeys.some((key) => !!control.errors?.[key]);
  }

  showPlayersRangeError(): boolean {
    const minPlayers = this.form.controls.minPlayers;
    const maxPlayers = this.form.controls.maxPlayers;

    return (
      this.form.touched &&
      this.form.hasError('invalidPlayersRange') &&
      (minPlayers.touched || maxPlayers.touched)
    );
  }

  showCharacterSheetsCountError(): boolean {
    return (
      this.form.controls.hasReadyCharacterSheets.touched &&
      this.form.hasError('invalidCharacterSheetsCount')
    );
  }

  private syncCharacterSheetsCount(count = this.characterSheetItems().length): void {
    this.form.controls.characterSheetsCount.setValue(
      this.form.controls.hasReadyCharacterSheets.getRawValue() ? count : 0,
      { emitEvent: false },
    );
    this.form.controls.characterSheetsCount.markAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private replaceNewCharacterSheetFiles(
    nextFiles: readonly NewSessionCharacterSheet[],
  ): void {
    const nextPreviewUrls = new Set(nextFiles.map((file) => file.previewUrl));

    untracked(this.newCharacterSheetFiles)
      .filter((file) => !nextPreviewUrls.has(file.previewUrl))
      .forEach((file) => URL.revokeObjectURL(file.previewUrl));

    this.newCharacterSheetFiles.set(nextFiles);
  }

  private isPdfFile(file: File): boolean {
    return (
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    );
  }
}
