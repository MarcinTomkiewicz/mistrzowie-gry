export type ImageTranscodeOptions = {
  maxW?: number;
  maxH?: number;
  prefer?: 'avif' | 'webp';
  quality?: number;
  largerFallbackFactor?: number;
};
