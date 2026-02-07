export interface IMenu {
  label: string;
  path?: string;
  children?: IMenu[];

  external?: boolean;
  target?: '_blank' | '_self';

  disabled?: boolean;
  badge?: string;

  /** sterowanie widocznością w przyszłości */
  roles?: string[];
  footer?: boolean;
}
