export const ADMIN_CONTRACTS_ROUTE = 'contracts';
export const CONTRACT_TEMPLATE_FAMILIES = ['ddd', 'parent_school', 'institution'] as const;
export type ContractTemplateFamily = typeof CONTRACT_TEMPLATE_FAMILIES[number];

export const CONTRACT_TEMPLATE_SOURCES: Record<ContractTemplateFamily, string> = {
  ddd: 'https://docs.google.com/document/d/1KW1Z-zLM7jNMVONjhH0yVNTakpvmuKbeKER66xYMGJE/edit',
  parent_school: 'https://docs.google.com/document/d/1FeCjbAIA092t5tLad0Rsl9zd4R7LUJ8YqhKKnGt0OV4/edit',
  institution: 'https://docs.google.com/document/d/1UTE7fFkra-wsWKTHclb0F6ySoTSEGM3aRLm9KQn7TSA/edit',
};

export const INITIAL_TEMPLATE_APPROVAL_REFERENCE = 'https://trello.com/c/0i31FDTI';
export const CONTRACT_TEMPLATE_PDF_MIME = 'application/pdf';
export const CONTRACT_TEMPLATE_PDF_MAX_BYTES = 26_214_400;
export const CONTRACT_TEMPLATE_PDF_PATH_PREFIX = '/storage/v1/object/sign/client-contracts/templates/';
