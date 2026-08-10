import type {
  CommercialActionAppearance,
  CommercialDurationMode,
} from '../types/commercial-page';
import type {
  CommercialActualCostBasis,
  CommercialBillingUnit,
  CommercialPercentageBasis,
  CommercialPriceType,
} from '../types/commercial-price';

export const COMMERCIAL_PAGE_DEFAULT_LOCALE = 'pl';

export const COMMERCIAL_PAGE_RPC = {
  getPublicBySlug: 'get_public_commercial_page_by_slug',
  getAdminList: 'get_admin_commercial_page_list',
  getAdminDetail: 'get_admin_commercial_page_detail',
  saveAdminDraft: 'save_admin_commercial_page_draft',
  validateAdminDraft: 'validate_admin_commercial_page_draft',
  getAdminPreview: 'get_admin_commercial_page_preview',
  getAdminUnsavedPreview: 'get_admin_commercial_page_unsaved_preview',
  publishAdmin: 'publish_admin_commercial_page',
} as const;

export const COMMERCIAL_CONSTANT_RPC = {
  getAdminList: 'get_admin_commercial_constant_list',
  saveAdmin: 'save_admin_commercial_constant',
  deleteAdmin: 'delete_admin_commercial_constant',
  publishAdmin: 'publish_admin_commercial_constants',
} as const;

export const COMMERCIAL_ACTION_APPEARANCES = [
  'primary',
  'success',
  'secondary',
] as const satisfies readonly CommercialActionAppearance[];

export const COMMERCIAL_PRICE_TYPES = [
  'fixed',
  'range',
  'from',
  'percentage',
  'actual_cost',
  'custom_quote',
] as const satisfies readonly CommercialPriceType[];

export const COMMERCIAL_BILLING_UNITS = [
  'session',
  'hour',
  'month',
  'event',
  'package',
  'table',
  'table_hour',
  'facilitator',
  'participant',
  'piece',
  'day',
  'half_day',
  'night',
  'kilometer',
] as const satisfies readonly CommercialBillingUnit[];

export const COMMERCIAL_PERCENTAGE_BASES = [
  'base_service',
  'package',
  'table',
  'facilitator',
] as const satisfies readonly CommercialPercentageBasis[];

export const COMMERCIAL_ACTUAL_COST_BASES = [
  'ticket',
  'accommodation',
  'documented_expense',
  'other',
] as const satisfies readonly CommercialActualCostBasis[];

export const COMMERCIAL_DURATION_MODES = [
  'standard_session',
  'custom',
] as const satisfies readonly CommercialDurationMode[];
