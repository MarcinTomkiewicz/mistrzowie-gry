import type { ISelectOption } from '../interfaces/i-select-option';
import type { CommercialProductKind } from './commercial-page-builder';

export type CommercialProductOption = ISelectOption<string> & {
  kind: CommercialProductKind;
};
