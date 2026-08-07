const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
} as const;

export function jsonNoStore(
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    headers.set(key, value);
  }
  return Response.json(body, { ...init, headers });
}

export async function readJson(
  request: Request,
  ErrorType: new () => Error,
): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new ErrorType();
  }
}

export async function readFormData(
  request: Request,
  ErrorType: new () => Error,
): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    throw new ErrorType();
  }
}
