import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import {
  FileRemoveEvent,
  FileSelectEvent,
  FileUpload as PrimeFileUpload,
  FileUploadModule,
} from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';

import { CropImageDialog } from '../crop-image-dialog/crop-image-dialog';
import {
  FileUploadCropConfig,
  FileUploadOptions,
  FileUploadSelectedImageState,
  FileUploadTexts,
} from '../../core/types/file-upload';
import {
  DEFAULT_FILE_UPLOAD_CROP_CONFIG,
  DEFAULT_FILE_UPLOAD_OPTIONS,
  DEFAULT_FILE_UPLOAD_TEXTS,
} from './file-upload.config';

function createInitialSelectedState(): FileUploadSelectedImageState {
  return {
  file: null,
  objectUrl: null,
  displayedFiles: [],
  };
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CropImageDialog,
    FileUploadModule,
    ImageModule,
  ],
  templateUrl: './file-upload.html',
})
export class FileUpload {
  private readonly uploader = viewChild<PrimeFileUpload>('uploader');
  private isResettingUploader = false;

  readonly texts = input<Partial<FileUploadTexts>>({});
  readonly options = input<Partial<FileUploadOptions>>({});
  readonly cropConfig = input<Partial<FileUploadCropConfig>>({});

  readonly valueChange = output<File | null>();
  readonly filesSelected = output<File[]>();

  readonly selected = signal(createInitialSelectedState());
  readonly pendingFile = signal<File | undefined>(undefined);

  readonly resolvedTexts = computed<FileUploadTexts>(() => ({
    ...DEFAULT_FILE_UPLOAD_TEXTS,
    ...this.texts(),
  }));
  readonly resolvedOptions = computed<FileUploadOptions>(() => ({
    ...DEFAULT_FILE_UPLOAD_OPTIONS,
    ...this.options(),
  }));
  readonly resolvedCropConfig = computed<FileUploadCropConfig>(() => ({
    ...DEFAULT_FILE_UPLOAD_CROP_CONFIG,
    ...this.cropConfig(),
  }));
  readonly previewUrl = computed(
    () => this.selected().objectUrl ?? this.resolvedOptions().currentUrl,
  );
  readonly cropVisible = computed(
    () => this.resolvedOptions().mode === 'image' && !!this.pendingFile(),
  );
  readonly isImageMode = computed(() => this.resolvedOptions().mode === 'image');

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.revokeObjectUrl();
    });
  }

  onSelect(event: FileSelectEvent): void {
    const files = Array.from(event.files ?? []);

    if (!files.length) {
      return;
    }

    if (!this.isImageMode()) {
      this.filesSelected.emit(files);

      if (this.resolvedOptions().clearAfterSelect) {
        this.uploader()?.clear();
      }

      return;
    }

    const file = files[0] ?? null;

    if (!file) {
      return;
    }

    this.pendingFile.set(file);
  }

  onRemove(event: FileRemoveEvent): void {
    if (!this.isImageMode()) {
      return;
    }

    if (event.file === this.selected().file) {
      this.clearSelectedFile();
    }
  }

  onClear(): void {
    if (this.isResettingUploader || !this.isImageMode()) {
      return;
    }

    this.clearSelectedFile();
  }

  onCropCancel(): void {
    this.pendingFile.set(undefined);
    this.resetPendingUploaderSelection();
  }

  onCropConfirm(file: File): void {
    this.setFile(file);
    this.pendingFile.set(undefined);
    this.uploader()?.clearInputElement();
  }

  private setFile(file: File | null): void {
    this.revokeObjectUrl();

    if (!file) {
      this.selected.set(createInitialSelectedState());
      this.valueChange.emit(null);
      return;
    }

    this.selected.set({
      file,
      objectUrl: URL.createObjectURL(file),
      displayedFiles: [file],
    });
    this.valueChange.emit(file);
  }

  private clearSelectedFile(): void {
    this.revokeObjectUrl();
    this.selected.set(createInitialSelectedState());
    this.valueChange.emit(null);
  }

  private revokeObjectUrl(): void {
    const current = this.selected().objectUrl;

    if (current) {
      URL.revokeObjectURL(current);
    }
  }

  private resetPendingUploaderSelection(): void {
    const uploader = this.uploader();
    const files = this.selected().displayedFiles;

    if (!uploader) {
      return;
    }

    this.isResettingUploader = true;
    uploader.clear();
    uploader.files = [...files];
    this.isResettingUploader = false;
  }
}
