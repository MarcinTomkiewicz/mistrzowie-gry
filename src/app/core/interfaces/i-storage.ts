export interface IStorageUploadOptions {
  bucket?: string;
  folder: string;
  ownerId: string;
  subfolders?: string[];
  currentPath?: string | null;
  removePrevious?: boolean;
  fileName?: string;
  usePublicUrl?: boolean;
}

export interface IStorageUploadResult {
  bucket: string;
  path: string;
  publicUrl: string | null;
}

export interface IPublicStorageUrlResolver {
  getPublicUrl(path: string | null | undefined, bucket?: string): string | null;
}

export interface ISignedStorageUpload {
  bucket: string;
  path: string;
  token: string;
  file: File;
  contentType: string;
}
