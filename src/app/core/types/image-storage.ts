export type ImageUploadOptions = {
  bucket?: string;
  contentType?: string;
  upsert?: boolean;
};

export type TranscodeOptions = {
  maxW?: number;
  maxH?: number;
  prefer?: 'avif' | 'webp';
  quality?: number;

  keepBaseName?: boolean;
  uniqueStrategy?: 'none' | 'date' | 'timestamp' | 'random';
  dateFormat?: string;

  largerFallbackFactor?: number;

  bucket?: string;
  upsert?: boolean;
};

export type RequiredTranscodeOptions = Required<TranscodeOptions>;
