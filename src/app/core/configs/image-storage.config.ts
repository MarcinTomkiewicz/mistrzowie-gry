import { ImageTranscodeOptions } from '../types/image-storage';

export const IMAGE_TRANSCODE_DEFAULTS: Required<ImageTranscodeOptions> = {
  maxW: 1600,
  maxH: 1200,
  prefer: 'avif',
  quality: 0.82,
  largerFallbackFactor: 1.15,
};
