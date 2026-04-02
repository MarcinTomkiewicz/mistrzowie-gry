import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SliderModule } from 'primeng/slider';

import {
  ImageCroppedEvent,
  ImageCropperComponent,
  ImageTransform,
} from 'ngx-image-cropper';

import {
  FileUploadCropConfig,
  FileUploadPreviewShape,
  FileUploadTexts,
} from '../../../core/types/file-upload';

type CropDialogCloseReason = 'confirm' | 'cancel' | null;

const createInitialTransform = (): ImageTransform => ({
  scale: 1,
  translateUnit: 'px',
});

@Component({
  selector: 'app-crop-image-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    ImageCropperComponent,
    ReactiveFormsModule,
    SliderModule,
  ],
  templateUrl: './crop-image-dialog.html',
  styleUrl: './crop-image-dialog.scss',
})
export class CropImageDialog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cropSurface =
    viewChild<ElementRef<HTMLElement>>('cropSurface');
  private readonly imageCropper = viewChild(ImageCropperComponent);
  private cropSurfaceResizeObserver: ResizeObserver | null = null;
  private cropDialogCloseReason: CropDialogCloseReason = null;

  readonly visible = input(false);
  readonly sourceFile = input<File | undefined>(undefined);
  readonly texts = input.required<FileUploadTexts>();
  readonly cropConfig = input.required<FileUploadCropConfig>();
  readonly previewShape = input<FileUploadPreviewShape>('circle');

  readonly cancel = output();
  readonly confirm = output<File>();

  readonly cropResultBlob = signal<Blob | null>(null);
  readonly cropResultObjectUrl = signal<string | null>(null);
  readonly maximized = signal(false);
  readonly scale = signal(1);
  readonly transform = signal<ImageTransform>(createInitialTransform());
  readonly zoomControl = new FormControl(1, { nonNullable: true });

  readonly cropOutputFormat = computed(() =>
    this.resolveOutputFormat(this.sourceFile()),
  );
  readonly previewShapes = computed(() => {
    const shapes = this.cropConfig().previewShapes
      .filter((shape): shape is FileUploadPreviewShape => !!shape)
      .filter((shape, index, values) => values.indexOf(shape) === index);

    return shapes.length ? shapes : [this.previewShape()];
  });

  constructor() {
    this.zoomControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.applyZoom(value));

    this.destroyRef.onDestroy(() => {
      this.disconnectCropSurfaceResizeObserver();
      this.revokeCropObjectUrl();
    });
  }

  onDialogHide(): void {
    if (this.cropDialogCloseReason === null) {
      this.cancel.emit();
    }

    this.resetState();
    this.cropDialogCloseReason = null;
  }

  onDialogMaximize(event: { maximized?: boolean }): void {
    this.maximized.set(!!event.maximized);
    this.observeCropSurface();
    this.scheduleCropperRefresh(!!event.maximized);
  }

  onCancel(): void {
    this.cropDialogCloseReason = 'cancel';
    this.cancel.emit();
  }

  onConfirm(): void {
    const sourceFile = this.sourceFile();
    const resultBlob = this.cropResultBlob();

    if (!sourceFile || !resultBlob) {
      this.onCancel();
      return;
    }

    this.cropDialogCloseReason = 'confirm';
    this.confirm.emit(this.createCroppedFile(sourceFile, resultBlob));
  }

  onCropperReady(): void {
    this.observeCropSurface();
    this.scheduleCropperRefresh(this.maximized());
  }

  onImageCropped(event: ImageCroppedEvent): void {
    this.revokeCropObjectUrl();
    this.cropResultBlob.set(event.blob ?? null);
    this.cropResultObjectUrl.set(event.objectUrl ?? null);
  }

  onTransformChange(transform: ImageTransform): void {
    const scale = transform.scale ?? this.scale();

    this.scale.set(scale);
    this.zoomControl.setValue(scale, { emitEvent: false });
    this.transform.set({
      ...transform,
      scale,
    });
  }

  onLoadFailed(): void {
    this.onCancel();
  }

  resolvePreviewLabel(shape: FileUploadPreviewShape): string {
    const texts = this.texts();

    switch (shape) {
      case 'circle':
        return texts.cropPreviewCircleLabel;
      case 'square':
        return texts.cropPreviewSquareLabel;
      case 'landscape':
      default:
        return texts.cropPreviewLandscapeLabel;
    }
  }

  private resetState(): void {
    this.disconnectCropSurfaceResizeObserver();
    this.revokeCropObjectUrl();
    this.cropResultBlob.set(null);
    this.cropResultObjectUrl.set(null);
    this.maximized.set(false);
    this.scale.set(1);
    this.zoomControl.setValue(1, { emitEvent: false });
    this.transform.set(createInitialTransform());
  }

  private applyZoom(value: number | null): void {
    const scale = Math.min(3, Math.max(0.5, value ?? 1));

    this.scale.set(scale);
    this.transform.update((current) => ({
      ...current,
      scale,
    }));
  }

  private revokeCropObjectUrl(): void {
    const current = this.cropResultObjectUrl();

    if (current) {
      URL.revokeObjectURL(current);
    }
  }

  private createCroppedFile(sourceFile: File, blob: Blob): File {
    const extension = this.resolveExtension(blob.type, sourceFile.name);
    const baseName = sourceFile.name.replace(/\.[^.]+$/, '');

    return new File([blob], `${baseName}.${extension}`, {
      type: blob.type || sourceFile.type,
      lastModified: Date.now(),
    });
  }

  private resolveOutputFormat(file: File | undefined): 'jpeg' | 'png' | 'webp' {
    switch (file?.type) {
      case 'image/jpeg':
        return 'jpeg';
      case 'image/png':
        return 'png';
      case 'image/webp':
      case 'image/avif':
      default:
        return 'webp';
    }
  }

  private resolveExtension(mimeType: string, fallbackName: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default: {
        const extension = fallbackName.split('.').pop()?.trim().toLowerCase();
        return extension || 'webp';
      }
    }
  }

  private observeCropSurface(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    requestAnimationFrame(() => {
      if (!this.visible()) {
        return;
      }

      const surface = this.cropSurface()?.nativeElement;

      if (!surface) {
        return;
      }

      this.disconnectCropSurfaceResizeObserver();
      this.cropSurfaceResizeObserver = new ResizeObserver(() => {
        this.scheduleCropperRefresh(this.maximized());
      });
      this.cropSurfaceResizeObserver.observe(surface);
      this.scheduleCropperRefresh(this.maximized());
    });
  }

  private scheduleCropperRefresh(resetPosition: boolean): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const cropper = this.imageCropper();

        if (!cropper) {
          return;
        }

        cropper.onResize();

        if (resetPosition) {
          cropper.resetCropperPosition();
        }
      });
    });
  }

  private disconnectCropSurfaceResizeObserver(): void {
    this.cropSurfaceResizeObserver?.disconnect();
    this.cropSurfaceResizeObserver = null;
  }
}
