import { isRecord } from '../utils/is-record.ts';

export const CONTRACT_FAMILY_KEY = /^[a-z][a-z0-9_]{0,63}$/u;
export const CONFIGURATION_MODES = ['catalog', 'generator'] as const;
export const CONTRACT_FIELD_KINDS = ['text', 'multiline', 'email', 'date', 'select', 'checkbox', 'integer', 'decimal'] as const;
export const CONFIGURATION_LIMITS = { pages: 100, fields: 200, placements: 1000, options: 100, bytes: 1_048_576 } as const;

export type ConfigurationMode = typeof CONFIGURATION_MODES[number];
export type ContractFieldKind = typeof CONTRACT_FIELD_KINDS[number];
export type ContractValue = string | number | boolean | null;
export type ContractValues = Readonly<Record<string, ContractValue>>;
export type ContractPage = { width: number; height: number };
export type ContractFieldOption = { value: string; label: string };
export type ContractVisibility = { fieldId: string; equals: string | boolean };
export type ContractFieldRules = { minLength?: number; maxLength?: number; min?: number; max?: number; decimalPlaces?: number };
export type ContractField = {
  id: string;
  label: string;
  kind: ContractFieldKind;
  required: boolean;
  options: ContractFieldOption[];
  visibleWhen: ContractVisibility | null;
  rules: ContractFieldRules;
};
export type ContractArea = { x: number; y: number; width: number; height: number };
type PlacementBase = ContractArea & { fieldId: string; page: number };
export type ContractPlacement = PlacementBase & (
  | { kind: 'text'; multiline: boolean; font: { family: 'regular'; sizePt: number; minSizePt: number } }
  | { kind: 'checkbox'; optionValue: string | null }
);
export type ContractTemplateConfiguration = { pages: ContractPage[]; fields: ContractField[]; placements: ContractPlacement[] };
export type ConfigurationIssue =
  | { code: 'empty' }
  | { code: 'unmapped-field' | 'unmapped-option' | 'empty-options'; fieldId: string }
  | { code: 'outside-page'; fieldId: string; placementIndex: number };

const FIELD_ID = /^[a-z][a-zA-Z0-9_]{0,63}$/u;
const OPTION_VALUE = /^[a-z0-9][a-z0-9_-]{0,63}$/u;

export function isContractLabel(value: unknown): value is string {
  return isBoundedLabel(value) && value.trim() === value;
}

export function trimContractFamilyLabel(value: string): string {
  // PostgreSQL btrim(text) removes only spaces by default.
  return value.replace(/^ +| +$/g, '');
}

export function isContractFamilyLabel(value: unknown): value is string {
  return isBoundedLabel(value) && trimContractFamilyLabel(value) === value;
}

function isBoundedLabel(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && [...value].length <= 200 && !/\p{Cc}/u.test(value);
}

export function isContractConfiguration(value: unknown): value is ContractTemplateConfiguration {
  if (!isRecord(value) || !exactKeys(value, ['pages', 'fields', 'placements'])) return false;
  const { pages, fields, placements } = value;
  if (
    !isContractPages(pages) || !Array.isArray(fields) || fields.length > CONFIGURATION_LIMITS.fields ||
    !Array.isArray(placements) || placements.length > CONFIGURATION_LIMITS.placements
  ) return false;

  const earlier = new Map<string, ContractField>();
  for (const field of fields) {
    if (!isField(field, earlier) || earlier.has(field.id)) return false;
    earlier.set(field.id, field);
  }

  const areas = new Set<string>();
  for (const placement of placements) {
    if (!isPlacement(placement, earlier)) return false;
    const { fieldId, page, x, y, width, height } = placement;
    const appearance = placement.kind === 'text'
      ? ['text', placement.multiline, placement.font.sizePt, placement.font.minSizePt]
      : ['checkbox', placement.optionValue];
    const key = JSON.stringify([fieldId, page, x, y, width, height, appearance]);
    if (areas.has(key)) return false;
    areas.add(key);
  }

  return new TextEncoder().encode(JSON.stringify(value)).byteLength <= CONFIGURATION_LIMITS.bytes;
}

export function isContractPages(value: unknown): value is ContractPage[] {
  return Array.isArray(value) && value.length <= CONFIGURATION_LIMITS.pages &&
    value.every((page: unknown) => isRecord(page) && exactKeys(page, ['width', 'height']) &&
      numberBetween(page['width'], 0.01, 14400) && numberBetween(page['height'], 0.01, 14400));
}

export function fitsContractPage(area: ContractArea, page: ContractPage | undefined): boolean {
  return page !== undefined && area.x >= 0 && area.y >= 0 &&
    area.x + area.width <= page.width && area.y + area.height <= page.height;
}

export function getConfigurationIssues(config: ContractTemplateConfiguration): ConfigurationIssue[] {
  const issues: ConfigurationIssue[] = [];
  if (!config.pages.length || !config.fields.length || !config.placements.length) issues.push({ code: 'empty' });
  config.fields.forEach((field) => {
    const placements = config.placements.filter(({ fieldId }) => fieldId === field.id);
    if (!placements.length) issues.push({ code: 'unmapped-field', fieldId: field.id });
    if (field.kind !== 'select') return;
    if (!field.options.length) issues.push({ code: 'empty-options', fieldId: field.id });
    const checks = placements.filter((item) => item.kind === 'checkbox');
    if (checks.length && field.options.some(({ value }) => !checks.some((item) => item.optionValue === value))) {
      issues.push({ code: 'unmapped-option', fieldId: field.id });
    }
  });
  config.placements.forEach((area, placementIndex) => {
    if (!fitsContractPage(area, config.pages[area.page - 1])) {
      issues.push({ code: 'outside-page', fieldId: area.fieldId, placementIndex });
    }
  });
  return issues;
}

export function isTextFieldKind(kind: ContractFieldKind): boolean {
  return kind === 'text' || kind === 'multiline' || kind === 'email';
}

export function matchesDecimalPrecision(value: number, places: number): boolean {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale === value;
}

function isField(value: unknown, earlier: ReadonlyMap<string, ContractField>): value is ContractField {
  if (!isRecord(value) || !exactKeys(value, ['id', 'label', 'kind', 'required', 'options', 'visibleWhen', 'rules'])) return false;
  const { id, label, kind, required, options, visibleWhen, rules } = value;
  return typeof id === 'string' && FIELD_ID.test(id) && isContractLabel(label) && isKind(kind) &&
    typeof required === 'boolean' && isOptions(options, kind) && isVisibility(visibleWhen, earlier) && isRules(rules, kind);
}

function isKind(value: unknown): value is ContractFieldKind {
  return CONTRACT_FIELD_KINDS.some((kind) => kind === value);
}

function isOptions(value: unknown, kind: ContractFieldKind): boolean {
  if (!Array.isArray(value) || value.length > CONFIGURATION_LIMITS.options) return false;
  if (kind !== 'select') return value.length === 0;
  const keys = new Set<string>();
  for (const option of value) {
    if (!isRecord(option) || !exactKeys(option, ['value', 'label'])) return false;
    const { value: key, label } = option;
    if (typeof key !== 'string' || !OPTION_VALUE.test(key) || keys.has(key) || !isContractLabel(label)) return false;
    keys.add(key);
  }
  return true;
}

function isVisibility(value: unknown, earlier: ReadonlyMap<string, ContractField>): boolean {
  if (value === null) return true;
  if (!isRecord(value) || !exactKeys(value, ['fieldId', 'equals']) || typeof value['fieldId'] !== 'string') return false;
  const source = earlier.get(value['fieldId']);
  return source?.kind === 'checkbox' ? typeof value['equals'] === 'boolean' :
    source?.kind === 'select' && source.options.some(({ value: option }) => option === value['equals']);
}

function isRules(value: unknown, kind: ContractFieldKind): boolean {
  if (!isRecord(value)) return false;
  if (isTextFieldKind(kind)) {
    const { minLength, maxLength } = value;
    return onlyKeys(value, ['minLength', 'maxLength']) &&
      (!Object.hasOwn(value, 'minLength') || integerBetween(minLength, 0, 5000)) &&
      (!Object.hasOwn(value, 'maxLength') || integerBetween(maxLength, 1, 5000)) &&
      orderedBounds(minLength, maxLength);
  }
  if (kind !== 'integer' && kind !== 'decimal') return Object.keys(value).length === 0;

  const { min, max, decimalPlaces } = value;
  if (kind === 'integer' ? !onlyKeys(value, ['min', 'max']) :
    !onlyKeys(value, ['min', 'max', 'decimalPlaces']) || !integerBetween(decimalPlaces, 0, 4)) return false;
  const places = typeof decimalPlaces === 'number' ? decimalPlaces : 0;
  return orderedBounds(min, max) && ['min', 'max'].every((key) =>
    !Object.hasOwn(value, key) ||
    (numberBetween(value[key], -1e12, 1e12) && matchesDecimalPrecision(value[key], places)));
}

function isPlacement(value: unknown, fields: ReadonlyMap<string, ContractField>): value is ContractPlacement {
  if (!isRecord(value)) return false;
  const { fieldId, page, x, y, width, height, kind, multiline, font, optionValue } = value;
  const field = typeof fieldId === 'string' ? fields.get(fieldId) : undefined;
  if (!field || !integerBetween(page, 1, CONFIGURATION_LIMITS.pages) ||
      !numberBetween(x, 0, 14400) || !numberBetween(y, 0, 14400) ||
      !numberBetween(width, 0.01, 14400) || !numberBetween(height, 0.01, 14400)) return false;
  const base = ['fieldId', 'kind', 'page', 'x', 'y', 'width', 'height'];
  if (kind === 'checkbox') {
    return exactKeys(value, [...base, 'optionValue']) &&
      (field.kind === 'checkbox' ? optionValue === null :
        field.kind === 'select' && field.options.some(({ value: option }) => option === optionValue));
  }
  return kind === 'text' && exactKeys(value, [...base, 'multiline', 'font']) &&
    field.kind !== 'checkbox' && typeof multiline === 'boolean' &&
    (field.kind !== 'multiline' || multiline) &&
    isRecord(font) && exactKeys(font, ['family', 'sizePt', 'minSizePt']) && font['family'] === 'regular' &&
    numberBetween(font['sizePt'], 1, 144) && numberBetween(font['minSizePt'], 1, font['sizePt']);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function onlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function numberBetween(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function integerBetween(value: unknown, min: number, max: number): value is number {
  return numberBetween(value, min, max) && Number.isInteger(value);
}

function orderedBounds(min: unknown, max: unknown): boolean {
  return typeof min !== 'number' || typeof max !== 'number' || min <= max;
}
