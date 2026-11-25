import type { ContractTemplateFamily } from '../configs/admin-contract-templates.config';

type ContractTemplateFieldArea = {
  /** One-based page number. */
  readonly page: number;
  /** PDF points measured from the lower-left corner of the page. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

type ContractTemplateField = ContractTemplateFieldArea & (
  | {
      readonly kind: 'text';
      readonly multiline: boolean;
      readonly font: {
        readonly family: string;
        readonly sizePt: number;
        readonly minSizePt: number;
      };
    }
  | { readonly kind: 'checkbox' }
);

export type ContractTemplateFieldMap = {
  readonly family: ContractTemplateFamily;
  readonly pdfSha256: string;
  readonly fields: Readonly<Record<string, ContractTemplateField>>;
};
