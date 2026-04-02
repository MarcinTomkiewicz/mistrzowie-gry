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
  FileUploadTexts,
} from '../../../core/types/file-upload';

export type {
  FileUploadCropConfig,
  FileUploadOptions,
  FileUploadPreviewShape,
  FileUploadTexts,
} from '../../../core/types/file-upload';

interface SelectedImageState {
  file: File | null;
  objectUrl: string | null;
  displayedFiles: File[];
}

const DEFAULT_TEXTS: FileUploadTexts = {
  chooseLabel: '',
  clearLabel: '',
  dropLabel: '',
  formatsLabel: '',
  previewAlt: '',
  cropTitle: '',
  cropHint: '',
  cropFrameAriaLabel: '',
  cropConfirmLabel: '',
  cropCancelLabel: '',
  cropProcessingLabel: '',
  zoomLabel: '',
  cropPreviewLabel: '',
  cropPreviewLandscapeLabel: '',
  cropPreviewCircleLabel: '',
  cropPreviewSquareLabel: '',
};

const DEFAULT_OPTIONS: FileUploadOptions = {
  accept: 'image/png,image/jpeg,image/webp,image/avif',
  maxFileSize: 5_000_000,
  currentUrl: null,
  disabled: false,
  previewShape: 'circle',
};

const DEFAULT_CROP_CONFIG: FileUploadCropConfig = {
  aspectRatio: 1,
  roundCropper: false,
  resizeToWidth: 0,
  resizeToHeight: 0,
  previewShapes: [],
};

const createInitialSelectedState = (): SelectedImageState => ({
  file: null,
  objectUrl: null,
  displayedFiles: [],
});

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

  readonly selected = signal(createInitialSelectedState());
  readonly pendingFile = signal<File | undefined>(undefined);

  readonly resolvedTexts = computed<FileUploadTexts>(() => ({
    ...DEFAULT_TEXTS,
    ...this.texts(),
  }));
  readonly resolvedOptions = computed<FileUploadOptions>(() => ({
    ...DEFAULT_OPTIONS,
    ...this.options(),
  }));
  readonly resolvedCropConfig = computed<FileUploadCropConfig>(() => ({
    ...DEFAULT_CROP_CONFIG,
    ...this.cropConfig(),
  }));
  readonly previewUrl = computed(
    () => this.selected().objectUrl ?? this.resolvedOptions().currentUrl,
  );
  readonly cropVisible = computed(() => !!this.pendingFile());

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.revokeObjectUrl();
    });
  }

  onSelect(event: FileSelectEvent): void {
    const file = event.files?.[0] ?? null;

    if (!file) {
      return;
    }

    this.pendingFile.set(file);
  }

  onRemove(event: FileRemoveEvent): void {
    if (event.file === this.selected().file) {
      this.clearSelectedFile();
    }
  }

  onClear(): void {
    if (this.isResettingUploader) {
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
