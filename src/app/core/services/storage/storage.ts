import { inject, Injectable } from '@angular/core';
import {
  catchError,
  defer,
  from,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import {
  IStorageUploadOptions,
  IStorageUploadResult,
} from '../../interfaces/i-storage';
import { stringToSlug } from '../../utils/slug';
import { Supabase } from '../supabase/supabase';

@Injectable({ providedIn: 'root' })
export class Storage {
  private readonly supabase = inject(Supabase).client();

  uploadFile(
    file: Blob,
    options: IStorageUploadOptions,
  ): Observable<IStorageUploadResult> {
    return defer(() => {
      const bucket = options.bucket ?? 'images';
      const path = this.buildStoragePath(file, options);
      const replacePath = this.resolveDestructivePath(
        options.replacePath,
        bucket,
      );

      return from(
        this.supabase.storage.from(bucket).upload(path, file, {
          upsert: options.upsert ?? false,
          contentType: file.type || undefined,
        }),
      ).pipe(
        switchMap(({ error }) => {
          if (error) {
            return throwError(() => error);
          }

          if (!replacePath || replacePath === path) {
            return of(
              this.createUploadResult(bucket, path, options.usePublicUrl),
            );
          }

          return this.removeFile(replacePath, bucket).pipe(
            map(() =>
              this.createUploadResult(bucket, path, options.usePublicUrl),
            ),
            catchError((error: unknown) =>
              this.removeFile(path, bucket).pipe(
                catchError(() => of(void 0)),
                switchMap(() => throwError(() => error)),
              ),
            ),
          );
        }),
      );
    });
  }

  removeFile(
    pathOrUrl: string | null | undefined,
    bucket = 'images',
  ): Observable<void> {
    return this.removeFiles(pathOrUrl ? [pathOrUrl] : [], bucket);
  }

  removeFiles(
    pathsOrUrls: readonly (string | null | undefined)[],
    bucket = 'images',
  ): Observable<void> {
    return defer(() => {
      const normalizedPaths = [
        ...new Set(
          pathsOrUrls
            .map((path) => this.resolveDestructivePath(path, bucket))
            .filter((path): path is string => !!path),
        ),
      ];

      if (!normalizedPaths.length) {
        return of(void 0);
      }

      return from(
        this.supabase.storage.from(bucket).remove(normalizedPaths),
      ).pipe(
        switchMap(({ error }) => {
          if (error) {
            return throwError(() => error);
          }

          return of(void 0);
        }),
      );
    });
  }

  getPublicUrl(
    path: string | null | undefined,
    bucket = 'images',
  ): string | null {
    const normalizedPath = this.resolveDisplayPath(path, bucket);

    if (!normalizedPath) {
      return null;
    }

    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(normalizedPath);
    return data.publicUrl ?? null;
  }

  buildStoragePath(file: Blob, options: IStorageUploadOptions): string {
    const folder = this.normalizeFolderPath(options.folder);
    const fileName = this.normalizeFileName(
      options.fileName?.trim() || this.createFileName(file),
    );

    if (!folder || !fileName) {
      throw new Error('[STORAGE] A valid folder and file name are required.');
    }

    return `${folder}/${fileName}`;
  }

  normalizeFileBaseName(fileName: string, maxLength?: number): string {
    const normalized = stringToSlug(this.stripExtension(fileName));

    return maxLength ? normalized.slice(0, maxLength) : normalized;
  }

  resolveFileExtension(fileName: string, mimeType: string): string {
    const fileNameExtension = this.extractExtension(fileName);

    if (fileNameExtension) {
      return fileNameExtension;
    }

    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/avif':
        return 'avif';
      case 'image/gif':
        return 'gif';
      case 'image/svg+xml':
        return 'svg';
      case 'application/pdf':
        return 'pdf';
      default:
        return 'bin';
    }
  }

  private createUploadResult(
    bucket: string,
    path: string,
    usePublicUrl: boolean | undefined,
  ): IStorageUploadResult {
    return {
      bucket,
      path,
      publicUrl: usePublicUrl === false ? null : this.getPublicUrl(path, bucket),
    };
  }

  private createFileName(file: Blob): string {
    const sourceName =
      'name' in file && typeof file.name === 'string' ? file.name : null;

    if (!sourceName) {
      throw new Error('[STORAGE] fileName is required for Blob uploads.');
    }

    const baseName = this.normalizeFileBaseName(sourceName) || 'file';
    const extension = this.resolveFileExtension(sourceName, file.type);

    return `${baseName}-${crypto.randomUUID()}.${extension}`;
  }

  private extractExtension(fileName: string): string | null {
    const normalized = fileName.trim();
    const lastDotIndex = normalized.lastIndexOf('.');

    if (lastDotIndex === -1 || lastDotIndex === normalized.length - 1) {
      return null;
    }

    return normalized.slice(lastDotIndex + 1).toLowerCase();
  }

  private stripExtension(fileName: string): string {
    const normalized = fileName.trim();
    const lastDotIndex = normalized.lastIndexOf('.');

    return lastDotIndex === -1
      ? normalized
      : normalized.slice(0, lastDotIndex);
  }

  private normalizeFolderPath(folder: string): string {
    return folder
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('/');
  }

  private normalizeFileName(fileName: string): string {
    const extension = this.extractExtension(fileName);
    const baseName = this.normalizeFileBaseName(fileName);

    if (!baseName) {
      return '';
    }

    return extension
      ? `${baseName}.${stringToSlug(extension)}`
      : baseName;
  }

  private resolveDisplayPath(
    pathOrUrl: string | null | undefined,
    bucket: string,
  ): string | null {
    try {
      return this.resolveDestructivePath(pathOrUrl, bucket);
    } catch {
      return null;
    }
  }

  private resolveDestructivePath(
    pathOrUrl: string | null | undefined,
    bucket: string,
  ): string | null {
    const value = pathOrUrl?.trim();

    if (!value) {
      return null;
    }

    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);

    if (!hasScheme) {
      const path = value.replace(/^\/+/, '');

      if (path) {
        return path;
      }

      throw new Error('[STORAGE] Invalid storage path.');
    }

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      throw new Error('[STORAGE] Unsupported storage URL.');
    }

    let url: URL;

    try {
      url = new URL(value);
    } catch {
      throw new Error('[STORAGE] Invalid storage URL.');
    }

    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.pathname.indexOf(marker);

    if (index === -1) {
      throw new Error('[STORAGE] URL does not reference the selected bucket.');
    }

    const path = url.pathname.slice(index + marker.length);

    if (!path) {
      throw new Error('[STORAGE] URL does not contain a storage path.');
    }

    return path;
  }
}
