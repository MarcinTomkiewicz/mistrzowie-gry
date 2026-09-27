export type IMenu = {
  path?: string;
  children?: IMenu[];

  external?: boolean;
  target?: '_blank' | '_self';

  disabled?: boolean;
  badgeKey?: string;

  roles?: string[];
  footer?: boolean;
} & (
  | { label: string; labelKey?: string }
  | { label?: undefined; labelKey: string }
);

export interface IResolvedMenu extends Omit<IMenu, 'badgeKey' | 'children'> {
  label: string;
  badge?: string;
  children?: IResolvedMenu[];
}
