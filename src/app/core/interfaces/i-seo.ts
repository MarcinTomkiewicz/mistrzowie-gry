export type ISeoRobots = 'index,follow' | 'noindex,nofollow' | 'noindex,follow' | 'index,nofollow';

export interface ISeoOpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string; // e.g. image/png
}

export interface ISeoConfig {
  /** <title> */
  title: string;

  /** <meta name="description"> */
  description?: string;

  /** Canonical absolute URL (recommended). If not provided, we auto-build from Router URL if possible. */
  canonicalUrl?: string;

  /** <meta name="robots"> */
  robots?: ISeoRobots;

  /** OpenGraph */
  og?: {
    title?: string;
    description?: string;
    type?: 'website' | 'article';
    url?: string;
    siteName?: string;
    images?: ISeoOpenGraphImage[];
  };

  /** Twitter cards */
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    image?: string;
  };
}