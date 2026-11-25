import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

const PDF_MIME_TYPE = "application/pdf";
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;
const DOWNLOAD_TTL_SECONDS = 300;
const UPLOAD_REJECTION_STATUSES = new Set([
  400,
  401,
  403,
  404,
  409,
  413,
  415,
  422,
  429,
]);

export class InvalidPdfError extends Error {
  constructor() {
    super("Invalid PDF file.");
    this.name = "InvalidPdfError";
  }
}

export class DocumentStorageError extends Error {
  constructor(
    readonly code: "UPLOAD_FAILED" | "INTERNAL_ERROR",
    readonly status?: number,
  ) {
    super("Document Storage operation failed.");
    this.name = "DocumentStorageError";
  }
}

export function isConfirmedDocumentUploadRejection(error: unknown): boolean {
  return error instanceof DocumentStorageError && error.status !== undefined &&
    UPLOAD_REJECTION_STATUSES.has(error.status);
}

export function privatePdfStorage(bucket: string, maxFileSize: number) {
  return {
    async readPdfFile(file: File): Promise<Uint8Array<ArrayBuffer>> {
      if (
        file.size < PDF_MAGIC.length || file.size > maxFileSize ||
        file.type !== PDF_MIME_TYPE || !file.name.toLowerCase().endsWith(".pdf")
      ) {
        throw new InvalidPdfError();
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!PDF_MAGIC.every((value, index) => bytes[index] === value)) {
        throw new InvalidPdfError();
      }
      return bytes;
    },

    async uploadPdf(
      client: SupabaseClient,
      path: string,
      bytes: Uint8Array,
      requestId?: string,
    ): Promise<void> {
      try {
        const { data, error } = await client.storage.from(bucket).upload(
          path,
          bytes,
          {
            contentType: PDF_MIME_TYPE,
            upsert: false,
          },
        );
        if (error !== null) {
          throw new DocumentStorageError("UPLOAD_FAILED", error.status);
        }
        if (data?.fullPath !== `${bucket}/${path}`) {
          throw new DocumentStorageError("UPLOAD_FAILED");
        }
      } catch (error) {
        if (!isConfirmedDocumentUploadRejection(error)) {
          console.error(JSON.stringify({
            code: "UPLOAD_OUTCOME_UNKNOWN",
            requestId,
            storagePath: path,
            bucket,
          }));
        }
        throw error;
      }
    },

    async removeDocumentPaths(
      client: SupabaseClient,
      paths: readonly string[],
    ): Promise<void> {
      if (paths.length === 0) return;
      const { error } = await client.storage.from(bucket).remove([
        ...new Set(paths),
      ]);
      if (error !== null) throw new DocumentStorageError("INTERNAL_ERROR");
    },

    async createDocumentDownload(
      client: SupabaseClient,
      path: string,
      filename: string,
    ): Promise<{ url: string; filename: string }> {
      const { data, error } = await client.storage.from(bucket).createSignedUrl(
        path,
        DOWNLOAD_TTL_SECONDS,
        { download: filename },
      );
      if (error !== null || data === null || data.signedUrl === "") {
        throw new DocumentStorageError("INTERNAL_ERROR");
      }
      return { url: data.signedUrl, filename };
    },
  };
}
