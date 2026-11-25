export const ADMIN_CONTRACTS_ROUTE = 'contracts';
export const CONTRACT_TEMPLATE_FAMILIES = ['ddd', 'parent_school', 'institution'] as const;
export type ContractTemplateFamily = typeof CONTRACT_TEMPLATE_FAMILIES[number];

export const CONTRACT_TEMPLATE_PDF_MIME = 'application/pdf';
export const CONTRACT_TEMPLATE_PDF_MAX_BYTES = 26_214_400;
export const CONTRACT_TEMPLATE_PDF_PATH_PREFIX = '/storage/v1/object/sign/client-contracts/templates/';
