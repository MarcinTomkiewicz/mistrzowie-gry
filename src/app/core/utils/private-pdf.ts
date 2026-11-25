import { environment } from '../../../env/environment';

const STORAGE_ORIGIN = new URL(environment.supabase.url).origin;

export function parsePrivatePdfUrl(signedUrl: string, pathPrefix: string): URL | null {
  let url: URL;
  try {
    url = new URL(signedUrl);
  } catch {
    return null;
  }

  if (url.origin !== STORAGE_ORIGIN || !url.pathname.startsWith(pathPrefix) ||
      url.username || url.password || !url.searchParams.get('token')) {
    return null;
  }
  return url;
}

export async function fetchPrivatePdf(
  signedUrl: string,
  pathPrefix: string,
  signal: AbortSignal,
): Promise<Blob> {
  const url = parsePrivatePdfUrl(signedUrl, pathPrefix);
  if (url === null) throw new Error('Invalid private document download URL.');

  const response = await fetch(url, {
    signal,
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
  });
  if (response.status !== 200) {
    await response.body?.cancel();
    throw new Error('Private document download failed.');
  }

  const pdf = await response.blob();
  if (await pdf.slice(0, 5).text() !== '%PDF-') {
    throw new Error('Invalid private document PDF.');
  }
  return pdf;
}
