export const UI_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type UiSize = (typeof UI_SIZES)[number];

export const UI_SEMANTIC_VARIANTS = [
  'base',
  'info',
  'success',
  'danger',
  'arcane',
] as const;
export type UiSemanticVariant = (typeof UI_SEMANTIC_VARIANTS)[number];