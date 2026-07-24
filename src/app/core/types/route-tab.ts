export type RouteTabDefinition<TId extends string = string> = {
  id: TId;
  label: string;
  icon: string;
  path: string;
};
