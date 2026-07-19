export type EdgeLiteral = string | number | boolean;

export type EdgeReader<TResult> = (value: unknown, path: string) => TResult;

export type EdgeReaderMap = Readonly<Record<string, EdgeReader<unknown>>>;

export type EdgeReaderResult<TReader> =
  TReader extends EdgeReader<infer TResult> ? TResult : never;

export type EdgeObjectReaderResult<TReaders extends EdgeReaderMap> = {
  readonly [TKey in keyof TReaders]: EdgeReaderResult<TReaders[TKey]>;
};
