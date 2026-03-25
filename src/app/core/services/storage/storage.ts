import { inject, Injectable } from '@angular/core';
import { from, map, Observable, of, switchMap, throwError } from 'rxjs';

import {
  IStorageUploadOptions,
  IStorageUploadResult,
} from '../../interfaces/i-storage';
import { Supabase } from '../supabase/supabase';

@Injectable({ providedIn: 'root' })
export class Storage {
  private readonly supabase = inject(Supabase).client();

  uploadImage(file: File, options: IStorageUploadOptions): Observable<IStorageUploadResult> {
    const bucket = options.bucket ?? 'images';
    const removePrevious = options.removePrevious ?? true;
    const path = this.buildStoragePath(file, options);

    return from(
      this.supabase.storage.from(bucket).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      }),
    ).pipe(
      switchMap(({ error }) => {
        if (error) {
          return throwError(() => error);
        }

        if (!removePrevious || !options.currentPath || options.currentPath === path) {
          return of(this.createUploadResult(bucket, path, options.usePublicUrl));
        }

        return this.removeFile(options.currentPath, bucket).pipe(
          map(() => this.createUploadResult(bucket, path, options.usePublicUrl)),
        );
      }),
    );
  }

  removeFile(pathOrUrl: string | null | undefined, bucket = 'images'): Observable<void> {
    const normalizedPath = this.normalizeStoragePath(pathOrUrl, bucket);

    if (!normalizedPath) {
      return of(void 0);
    }

    return from(
      this.supabase.storage.from(bucket).remove([normalizedPath]),
    ).pipe(
      switchMap(({ error }) => {
        if (error) {
          return throwError(() => error);
        }

        return of(void 0);
      }),
    );
  }

  getPublicUrl(path: string | null | undefined, bucket = 'images'): string | null {
    const normalizedPath = this.normalizeStoragePath(path, bucket);

    if (!normalizedPath) {
      return null;
    }

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(normalizedPath);

    return data.publicUrl ?? null;
  }

  buildStoragePath(file: File, options: IStorageUploadOptions): string {
    const fileName = options.fileName?.trim() || this.createFileName(file);
    const segments = [
      options.folder,
      options.ownerId,
      ...(options.subfolders ?? []),
      fileName,
    ];

    return segments
      .map((segment) => this.sanitizePathSegment(segment))
      .filter(Boolean)
      .join('/');
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

  private createFileName(file: File): string {
    const baseName = this.stripExtension(file.name).trim() || 'image';
    const extension = this.resolveExtension(file);
    const timestamp = Date.now();

    return `${this.sanitizePathSegment(baseName)}-${timestamp}.${extension}`;
  }

  private resolveExtension(file: File): string {
    const fileNameExtension = this.extractExtension(file.name);

    if (fileNameExtension) {
      return fileNameExtension;
    }

    switch (file.type) {
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
      default:
        return 'bin';
    }
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

    if (lastDotIndex === -1) {
      return normalized;
    }

    return normalized.slice(0, lastDotIndex);
  }

  private sanitizePathSegment(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeStoragePath(
    pathOrUrl: string | null | undefined,
    bucket: string,
  ): string | null {
    const value = pathOrUrl?.trim();

    if (!value) {
      return null;
    }

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return value.replace(/^\/+/, '');
    }

    try {
      const url = new URL(value);
      const marker = `/storage/v1/object/public/${bucket}/`;
      const index = url.pathname.indexOf(marker);

      if (index === -1) {
        return null;
      }

      return url.pathname.slice(index + marker.length);
    } catch {
      return null;
    }
  }
}