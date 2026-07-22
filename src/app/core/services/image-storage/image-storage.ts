import { inject, Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';

import { IMAGE_TRANSCODE_DEFAULTS } from '../../configs/image-storage.config';
import { IStorageUploadOptions } from '../../interfaces/i-storage';
import { ImageTranscodeOptions } from '../../types/image-storage';
import { withDefaults } from '../../utils/with-defaults';
import { Storage } from '../storage/storage';

@Injectable({ providedIn: 'root' })
export class ImageStorage {
  private readonly storage = inject(Storage);

  transcodeAndUpload(
    file: File,
    uploadOptions: IStorageUploadOptions,
    transcodeOptions?: ImageTranscodeOptions,
  ): Observable<string> {
    const config = withDefaults(transcodeOptions, IMAGE_TRANSCODE_DEFAULTS);

    return from(this.transcode(file, config)).pipe(
      switchMap((image) =>
        this.storage.uploadFile(image, {
          ...uploadOptions,
          fileName: image.name,
        }),
      ),
      map((result) => result.path),
    );
  }

  private async transcode(
    file: File,
    options: Required<ImageTranscodeOptions>,
  ): Promise<File> {
    let encoded: Blob | null = null;

    try {
      encoded = await this.downscaleAndEncode(file, options);
    } catch {
      encoded = null;
    }

    const blob: Blob =
      encoded && encoded.size <= file.size * options.largerFallbackFactor
        ? encoded
        : file;
    const useOriginal = blob === file;
    const mime = blob.type || file.type || 'application/octet-stream';
    const extension = useOriginal
      ? this.storage.resolveFileExtension(file.name, mime)
      : this.storage.resolveFileExtension('', mime);
    const name = this.createFileName(file.name, extension);

    return new File([blob], name, { type: mime });
  }

  private async downscaleAndEncode(
    source: Blob,
    options: Required<ImageTranscodeOptions>,
  ): Promise<Blob | null> {
    const image = await this.loadImage(source);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const ratio = Math.min(options.maxW / width, options.maxH / height, 1);
    const canvas = document.createElement('canvas');

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return this.encode(canvas, options);
  }

  private async encode(
    canvas: HTMLCanvasElement,
    options: Required<ImageTranscodeOptions>,
  ): Promise<Blob | null> {
    const preferredMime = `image/${options.prefer}`;
    const fallbackMime = options.prefer === 'avif' ? 'image/webp' : 'image/avif';
    const preferred = await this.toBlob(canvas, preferredMime, options.quality);

    return preferred ?? this.toBlob(canvas, fallbackMime, options.quality);
  }

  private loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      image.src = url;
    });
  }

  private toBlob(
    canvas: HTMLCanvasElement,
    mime: string,
    quality: number,
  ): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
  }

  private createFileName(
    originalName: string,
    extension: string,
  ): string {
    const baseName =
      this.storage.normalizeFileBaseName(originalName, 60) || 'file';

    return `${baseName}-${crypto.randomUUID()}.${extension}`;
  }
}
