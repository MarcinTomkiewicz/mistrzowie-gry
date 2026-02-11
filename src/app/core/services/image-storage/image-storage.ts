import { Injectable, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { Supabase } from '../supabase/supabase';
import { formatDate } from '../../utils/date-format';
import { withDefaults } from '../../utils/with-defaults';
import type {
  ImageUploadOptions,
  RequiredTranscodeOptions,
  TranscodeOptions,
} from '../../types/image-storage';

const DEFAULT_TRANSCODE: RequiredTranscodeOptions = {
  maxW: 1600,
  maxH: 1200,
  prefer: 'avif',
  quality: 0.82,

  keepBaseName: true,
  uniqueStrategy: 'date',
  dateFormat: 'dd-MM-yyyy-HHmmss',

  largerFallbackFactor: 1.15,

  bucket: 'images',
  upsert: true,
};

@Injectable({ providedIn: 'root' })
export class ImageStorage {
  private readonly supabase: SupabaseClient = inject(Supabase).client();

  // =========================
  // Upload (raw file)
  // =========================

  upload(
    file: File,
    fullPath: string,
    opts?: ImageUploadOptions,
  ): Observable<string> {
    const bucketName = opts?.bucket ?? 'images';
    const bucket = this.supabase.storage.from(bucketName);

    return from(
      bucket.upload(fullPath, file, {
        contentType:
          opts?.contentType ?? file.type ?? 'application/octet-stream',
        upsert: opts?.upsert ?? true,
      }),
    ).pipe(
      map((res) => {
        if (res.error) throw new Error(res.error.message);
        return fullPath;
      }),
    );
  }

  uploadIntoFolder(
    file: File,
    folderPath: string,
    opts?: ImageUploadOptions,
  ): Observable<string> {
    const ext = this.extOf(file.name) || this.extOfMime(file.type) || 'bin';
    const safeFolder = folderPath.replace(/\/+$/, '');
    const fileName = `${Date.now()}.${ext}`;
    const fullPath = `${safeFolder}/${fileName}`;
    return this.upload(file, fullPath, opts);
  }

  uploadOrReplace(
    file: File | null,
    folderPath: string,
    previousPath: string | null,
    opts?: ImageUploadOptions,
  ): Observable<string> {
    if (!file) return of(previousPath ?? '');

    const bucketName = opts?.bucket ?? 'images';
    const bucket = this.supabase.storage.from(bucketName);

    const safeFolder = folderPath.replace(/\/+$/, '');
    const fullPath = `${safeFolder}/${file.name}`;

    const remove$ = previousPath
      ? from(bucket.remove([previousPath])).pipe(
          map((res) => {
            if (res.error) throw new Error(res.error.message);
            return void 0;
          }),
        )
      : of(void 0);

    return remove$.pipe(switchMap(() => this.upload(file, fullPath, opts)));
  }

  // =========================
  // Public URLs
  // =========================

  publicUrl(path: string, bucket = 'images'): string {
    if (!path) return '';
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  optimizedUrl(publicUrl: string, width = 600, height = 400): string {
    if (!publicUrl) return '';
    return `${publicUrl}?width=${width}&height=${height}`;
  }

  optimizedPublicUrl(
    path: string,
    width = 600,
    height = 400,
    bucket = 'images',
  ): string {
    return this.optimizedUrl(this.publicUrl(path, bucket), width, height);
  }

  processImageFields<T extends Record<string, any>>(
    item: T,
    width = 600,
    height = 400,
    bucket = 'images',
  ): T {
    if (!item || typeof item !== 'object') return item;

    const out = { ...item } as T;

    for (const key of Object.keys(out) as Array<keyof T>) {
      const v = out[key];

      if (
        typeof v === 'string' &&
        String(key).toLowerCase().endsWith('image') &&
        v
      ) {
        out[key] = this.optimizedPublicUrl(
          v,
          width,
          height,
          bucket,
        ) as T[typeof key];
      }
    }

    return out;
  }

  // =========================
  // Transcode + upload
  // =========================

  transcodeAndUpload(
    file: File,
    basePath: string,
    opts?: TranscodeOptions,
  ): Observable<string> {
    const cfg = withDefaults<TranscodeOptions>(opts, DEFAULT_TRANSCODE);

    const bucket = this.supabase.storage.from(cfg.bucket);
    const safeBase = basePath.replace(/\/+$/, '');

    const uniqueSuffix = (): string => {
      if (cfg.uniqueStrategy === 'none') return '';
      if (cfg.uniqueStrategy === 'random')
        return Math.random().toString(36).slice(2, 8);

      if (cfg.uniqueStrategy === 'timestamp') {
        const d = new Date();
        return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d
          .getDate()
          .toString()
          .padStart(2, '0')}${d.getHours().toString().padStart(2, '0')}${d
          .getMinutes()
          .toString()
          .padStart(2, '0')}${d.getSeconds().toString().padStart(2, '0')}`;
      }

      return formatDate(new Date(), cfg.dateFormat);
    };

    const baseNameOf = (name: string) => name.replace(/\.[^.]+$/, '');
    const slugBase = (name: string) => {
      const base = cfg.keepBaseName ? baseNameOf(name) : 'file';
      const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
      return slug || 'file';
    };

    const loadImage = (blob: Blob) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });

    const toBlob = (canvas: HTMLCanvasElement, mime: string, q: number) =>
      new Promise<Blob | null>((res) => canvas.toBlob(res, mime, q));

    const tryEncode = async (
      canvas: HTMLCanvasElement,
    ): Promise<{ blob: Blob; ext: string; mime: string } | null> => {
      if (cfg.prefer === 'avif') {
        const avif = await toBlob(canvas, 'image/avif', cfg.quality);
        if (avif) return { blob: avif, ext: 'avif', mime: 'image/avif' };
        const webp = await toBlob(canvas, 'image/webp', cfg.quality);
        if (webp) return { blob: webp, ext: 'webp', mime: 'image/webp' };
      } else {
        const webp = await toBlob(canvas, 'image/webp', cfg.quality);
        if (webp) return { blob: webp, ext: 'webp', mime: 'image/webp' };
        const avif = await toBlob(canvas, 'image/avif', cfg.quality);
        if (avif) return { blob: avif, ext: 'avif', mime: 'image/avif' };
      }
      return null;
    };

    const downscaleAndEncode = async (src: Blob) => {
      const img = await loadImage(src);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      const ratio = Math.min(cfg.maxW / w, cfg.maxH / h, 1);
      const targetW = Math.round(w * ratio);
      const targetH = Math.round(h * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(img, 0, 0, targetW, targetH);
      return tryEncode(canvas);
    };

    const run = async (): Promise<{
      blob: Blob;
      name: string;
      mime: string;
    }> => {
      let encoded: { blob: Blob; ext: string; mime: string } | null = null;

      try {
        encoded = await downscaleAndEncode(file);
      } catch {
        encoded = null;
      }

      let finalBlob: Blob;
      let ext: string;
      let mime: string;

      if (!encoded) {
        finalBlob = file;
        ext = this.extOf(file.name) || this.extOfMime(file.type) || 'bin';
        mime = file.type || 'application/octet-stream';
      } else if (encoded.blob.size > file.size * cfg.largerFallbackFactor) {
        finalBlob = file;
        ext = this.extOf(file.name) || this.extOfMime(file.type) || 'bin';
        mime = file.type || 'application/octet-stream';
      } else {
        finalBlob = encoded.blob;
        ext = encoded.ext;
        mime = encoded.mime;
      }

      const base = slugBase(file.name);
      const suf = uniqueSuffix();
      const name = suf ? `${base}-${suf}.${ext}` : `${base}.${ext}`;

      return { blob: finalBlob, name, mime };
    };

    return from(run()).pipe(
      switchMap(({ blob, name, mime }) => {
        const fullPath = `${safeBase}/${name}`;
        return from(
          bucket.upload(fullPath, blob, {
            contentType: mime,
            upsert: cfg.upsert,
          }),
        ).pipe(
          map((res) => {
            if (res.error) throw new Error(res.error.message);
            return fullPath;
          }),
        );
      }),
    );
  }

  // =========================
  // private helpers
  // =========================

  private extOf(name: string): string {
    const m = name.match(/\.([^.]+)$/);
    return m ? m[1].toLowerCase() : '';
  }

  private extOfMime(mime?: string): string {
    if (!mime) return '';
    if (mime === 'image/avif') return 'avif';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/svg+xml') return 'svg';
    return '';
  }
}
