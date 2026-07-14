export class RpcError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: string,
    public readonly hint: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RpcError';
  }
}
