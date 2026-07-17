export type EdgeHttpMethod = 'GET' | 'POST' | 'PUT';

export type EdgeInvokeOptions<TBody = never> =
  | {
      method: 'GET';
      body?: never;
    }
  | {
      method: Exclude<EdgeHttpMethod, 'GET'>;
      body?: TBody;
    };
