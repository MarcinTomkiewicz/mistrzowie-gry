export interface ISelectOption<TValue extends string | number = string> {
  value: TValue;
  label: string;
}
