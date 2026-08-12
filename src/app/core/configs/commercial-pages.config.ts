import type {
  CommercialActionAppearance,
  CommercialPageKey,
} from '../types/commercial-page';
import type { CommercialConstantValueType } from '../types/commercial-constant-admin';
import type {
  CommercialBlockType,
  CommercialButtonLayout,
  CommercialCardOrientation,
  CommercialCardsBlock,
  CommercialEditorDuration,
  CommercialEditorParticipants,
  CommercialIconKey,
  CommercialProductKind,
  CommercialProductCollectionBlock,
  CommercialProductCollectionCardsBlock,
  CommercialProductFieldKey,
  CommercialSectionSurface,
  CommercialSessionCount,
  CommercialTextAlign,
} from '../types/commercial-page-builder';
import type { CommonNavTranslations } from '../types/i18n/common';
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

export const COMMERCIAL_CONSTANT_VALUE_TYPES = [
  'duration',
  'integer',
  'text',
] as const satisfies readonly CommercialConstantValueType[];

export const COMMERCIAL_PAGE_NAVIGATION_LABEL_KEYS = {
  'individual-offer': 'individualOffer',
  'business-offer': 'businessOffer',
  'institution-offer': 'institutionOffer',
  'event-offer': 'eventOffer',
  'standards-logistics': 'standardsAndLogistics',
} as const satisfies Record<CommercialPageKey, keyof CommonNavTranslations>;

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

export const COMMERCIAL_BUILDER_BLOCK_TYPES = [
  'rich_text',
  'buttons',
  'cards',
  'product_collection',
  'table',
  'faq',
] as const satisfies readonly CommercialBlockType[];

export const COMMERCIAL_SECTION_SURFACES = [
  'plain',
  'card',
] as const satisfies readonly CommercialSectionSurface[];

export const COMMERCIAL_TEXT_ALIGNS = [
  'left',
  'center',
  'right',
] as const satisfies readonly CommercialTextAlign[];

export const COMMERCIAL_BUTTON_LAYOUTS = [
  'horizontal',
  'vertical',
] as const satisfies readonly CommercialButtonLayout[];

export const COMMERCIAL_CARD_ORIENTATIONS = [
  'vertical',
  'horizontal',
] as const satisfies readonly CommercialCardOrientation[];

export const COMMERCIAL_MANUAL_CARD_COLUMNS = [
  1,
  2,
  3,
] as const satisfies readonly CommercialCardsBlock['presentation']['columns'][];

export const COMMERCIAL_PRODUCT_CARD_COLUMNS = [
  1,
  2,
  3,
] as const satisfies readonly CommercialProductCollectionCardsBlock['presentation']['columns'][];

export const COMMERCIAL_PRODUCT_COLLECTION_PRESENTATIONS = [
  'cards',
  'table',
  'comparison_table',
] as const satisfies readonly CommercialProductCollectionBlock['presentation']['type'][];

export const COMMERCIAL_PRODUCT_FIELD_KEYS = [
  'name',
  'description',
  'price',
  'duration',
  'participants',
  'participantsPerFacilitatorMax',
  'sessions',
  'meetingCount',
  'facilitatorCount',
  'tableCount',
  'includedAddons',
] as const satisfies readonly CommercialProductFieldKey[];

export const COMMERCIAL_PRODUCT_KINDS = [
  'product',
  'addon',
] as const satisfies readonly CommercialProductKind[];

export const COMMERCIAL_SESSION_MODES = [
  'not_applicable',
  'total',
  'per_month',
] as const satisfies readonly CommercialSessionCount['mode'][];

const COMMERCIAL_ICON_KEYS = [
  'overlord',
  'shop-bag',
  'cash',
  'd20',
  'moon-bats',
  'sun-eclipse',
  'direction-sign',
  'teacher',
  'read',
  'uprising',
  'evil-book',
  'send-message',
  'message-away',
  'blacksmith',
  'shield-bash',
  'd10',
  'stairs-goal',
  'call-me',
  'chest',
  'wizard',
  'tied-scroll',
  'danger-orc',
  'biohazard',
  'success-eagle',
  'expand',
  'contract',
  'scroll-quill',
  'teleport',
  'horus',
  'closed-eye',
  'soul',
  'mona-lisa',
  'vacuum-cleaner',
  'quill',
  'demolish',
  'creation',
  'interdiction',
  'trail',
  'lever',
  'point-left',
  'point-right',
  'add-plus',
  'done-it',
  'show-down',
  'marble',
  'workforce',
  'wood',
  'sundial',
  'hydra',
  'skills',
  'helmet',
  'trade',
  'capitol',
  'one-handed',
  'two-handed',
  'bow-weapon',
  'greaves',
  'boots',
  'ring',
  'amulet',
  'armory-helmet',
  'armor',
  'warehouse',
  'equip',
  'sold',
  'maze',
  'medusa',
  'sphinx',
  'laurels',
  'settings',
  'notification-icon',
  'trial',
  'siege',
  'spy',
  'settle',
  'report-resource',
  'report-trial',
  'report-exploration',
  'report-buff',
  'report-debuff',
  'report-combat',
  'report-spy',
  'report-draw',
] as const satisfies readonly CommercialIconKey[];

export function commercialIconClass(iconKey: CommercialIconKey): string {
  return `pi pi-${iconKey}`;
}

export const COMMERCIAL_ICON_OPTIONS = COMMERCIAL_ICON_KEYS.map((value) => ({
  value,
  label: value,
  icon: commercialIconClass(value),
}));

export const COMMERCIAL_EDITOR_DURATION_MODES = [
  'standard',
  'custom',
  'not_applicable',
] as const satisfies readonly CommercialEditorDuration['mode'][];

export const COMMERCIAL_EDITOR_PARTICIPANTS_MODES = [
  'standard',
  'custom',
  'not_applicable',
] as const satisfies readonly CommercialEditorParticipants['mode'][];
