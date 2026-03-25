import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import {
  FileRemoveEvent,
  FileSelectEvent,
  FileUploadModule,
} from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';

import { IFileUploadValue } from '../../../core/interfaces/i-file-upload';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, ButtonModule, FileUploadModule, ImageModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
})
export class FileUpload {
  readonly label = input<string>('');
  readonly chooseLabel = input<string>('');
  readonly clearLabel = input<string>('');
  readonly dropLabel = input<string>('');
  readonly formatsLabel = input<string>('');
  readonly previewAlt = input<string>('');
  readonly accept = input<string>('image/png,image/jpeg,image/webp,image/avif');
  readonly maxFileSize = input<number>(5_000_000);
  readonly currentUrl = input<string | null>(null);
  readonly disabled = input<boolean>(false);

  readonly valueChange = output<IFileUploadValue>();
  readonly removeStored = output<void>();

  readonly selectedFile = signal<File | null>(null);
  readonly selectedObjectUrl = signal<string | null>(null);

  readonly previewUrl = computed(
    () => this.selectedObjectUrl() ?? this.currentUrl(),
  );

  readonly hasPreview = computed(() => !!this.previewUrl());
  readonly hasSelectedFile = computed(() => !!this.selectedFile());

  onSelect(event: FileSelectEvent): void {
    const file = event.files?.[0] ?? null;

    this.setFile(file);
  }

  onRemove(event: FileRemoveEvent): void {
    if (event.file === this.selectedFile()) {
      this.clearSelectedFile();
    }
  }

  onClear(): void {
    this.clearSelectedFile();
  }

  onRemoveStored(): void {
    this.removeStored.emit();
  }

  private setFile(file: File | null): void {
    this.revokeObjectUrl();

    if (!file) {
      this.selectedFile.set(null);
      this.selectedObjectUrl.set(null);
      this.valueChange.emit({
        file: null,
        objectUrl: null,
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    this.selectedFile.set(file);
    this.selectedObjectUrl.set(objectUrl);
    this.valueChange.emit({
      file,
      objectUrl,
    });
  }

  private clearSelectedFile(): void {
    this.revokeObjectUrl();
    this.selectedFile.set(null);
    this.selectedObjectUrl.set(null);
    this.valueChange.emit({
      file: null,
      objectUrl: null,
    });
  }

  private revokeObjectUrl(): void {
    const current = this.selectedObjectUrl();

    if (current) {
      URL.revokeObjectURL(current);
    }
  }
}