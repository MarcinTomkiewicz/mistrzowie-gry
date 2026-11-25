export function isContractTemplateSourceUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }
  return url.origin === 'https://docs.google.com' && url.username === '' && url.password === '' &&
    url.pathname.startsWith('/document/') && url.pathname !== '/document/';
}
