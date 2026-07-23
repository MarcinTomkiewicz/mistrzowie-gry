import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

export interface StorageObject {
  bucket: string;
  path: string;
}

export class StorageCallError extends Error {
  constructor(readonly operation: string) {
    super("Storage operation failed.");
    this.name = "StorageCallError";
  }
}

export async function createSignedUploadUrl(
  client: SupabaseClient,
  target: StorageObject,
  operation: string,
): Promise<{ signedUrl: string; token: string }> {
  try {
    const { data, error } = await client.storage
      .from(target.bucket)
      .createSignedUploadUrl(target.path, { upsert: false });

    if (
      error !== null ||
      data === null ||
      typeof data.signedUrl !== "string" ||
      data.signedUrl === "" ||
      typeof data.token !== "string" ||
      data.token === ""
    ) {
      throw new StorageCallError(operation);
    }

    return { signedUrl: data.signedUrl, token: data.token };
  } catch (error) {
    if (error instanceof StorageCallError) {
      throw error;
    }
    throw new StorageCallError(operation);
  }
}

export async function createSignedDownloadUrl(
  client: SupabaseClient,
  target: StorageObject,
  expiresInSeconds: number,
  operation: string,
): Promise<string> {
  try {
    const { data, error } = await client.storage
      .from(target.bucket)
      .createSignedUrl(target.path, expiresInSeconds);

    if (
      error !== null ||
      data === null ||
      typeof data.signedUrl !== "string" ||
      data.signedUrl === ""
    ) {
      throw new StorageCallError(operation);
    }

    return data.signedUrl;
  } catch (error) {
    if (error instanceof StorageCallError) {
      throw error;
    }
    throw new StorageCallError(operation);
  }
}

export async function downloadStorageObject(
  client: SupabaseClient,
  target: StorageObject,
  operation: string,
): Promise<ArrayBuffer> {
  let data: Blob;

  try {
    const result = await client.storage
      .from(target.bucket)
      .download(target.path);
    if (result.error !== null || result.data === null) {
      throw new StorageCallError(operation);
    }
    data = result.data;
  } catch (error) {
    if (error instanceof StorageCallError) {
      throw error;
    }
    throw new StorageCallError(operation);
  }

  try {
    return await data.arrayBuffer();
  } catch {
    throw new StorageCallError(operation);
  }
}

export async function removeStorageObject(
  client: SupabaseClient,
  target: StorageObject,
): Promise<boolean> {
  try {
    const { error } = await client.storage
      .from(target.bucket)
      .remove([target.path]);
    return error === null;
  } catch {
    return false;
  }
}
