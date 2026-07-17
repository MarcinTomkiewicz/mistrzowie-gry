export class EdgeFunctionError extends Error {
  constructor(
    public readonly status: number | null,
    public readonly code: string,
    message: string,
    public readonly fieldErrors: Readonly<Record<string, string>>,
    public override readonly cause: unknown,
  ) {
    super(message, { cause });
    this.name = 'EdgeFunctionError';
  }
}
