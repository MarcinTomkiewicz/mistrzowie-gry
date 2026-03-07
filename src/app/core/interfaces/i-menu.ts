export interface IMenu {
  labelKey: string;
  path?: string;
  children?: IMenu[];

  external?: boolean;
  target?: '_blank' | '_self';

  disabled?: boolean;
  badgeKey?: string;

    roles?: string[];
  footer?: boolean;
}

export interface IResolvedMenu extends Omit<IMenu, 'badgeKey' | 'children'> {
  label: string;
  badge?: string;
  children?: IResolvedMenu[];
}