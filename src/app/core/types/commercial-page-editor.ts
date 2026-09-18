import type { ISelectOption } from '../interfaces/i-select-option';
import type { CommercialPageEditorSeo } from './commercial-page';
import type {
  CommercialBuilderSection,
  CommercialEditorProduct,
  CommercialProductKind,
} from './commercial-page-builder';

export type CommercialPageEditorDocument = {
  slug: string;
  heading: string;
  lead: string | null;
  seo: CommercialPageEditorSeo;
  products: CommercialEditorProduct[];
  sections: CommercialBuilderSection[];
};

export type CommercialProductOption = ISelectOption<string> & {
  kind: CommercialProductKind;
};
