import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { EVENT_CURRENCIES, EVENT_PRICE_BASES } from '../configs/events.config';
import { ParticipantSignupKind } from '../enums/event';
import type { AdminEventPolicyDraft, PolicyCityOverride, PolicyDocument, PolicyOverride, PolicyPrice, PolicyPricedValue } from '../interfaces/i-admin-event-policy';
import type { EventCurrency, EventGlobalPrice, EventPriceBasis } from '../interfaces/i-admin-global-event';
import { assertEdgeContract } from '../utils/edge-contract';
import { pricePrecisionValidator } from '../validators/price.validator';
import { integerValidator } from '../validators/form-value.validator';

export function createEventPolicyPriceForm() {
  const form = new FormGroup({
    amount: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(99999999.99), pricePrecisionValidator] }),
    currency: new FormControl<EventCurrency>('PLN', { nonNullable: true, validators: [Validators.required,
      control => EVENT_CURRENCIES.some(value => value === control.value) ? null : { currency: true }] }),
    basis: new FormControl<EventPriceBasis | null>(null),
  });
  form.addValidators(() => {
    const { amount, basis } = form.getRawValue();
    return amount === null ? (basis === null ? null : { basis: true })
      : EVENT_PRICE_BASES.some(value => value === basis) ? null : { basis: true };
  });
  return form;
}

export function mapEventPolicyDocument(read: AdminEventPolicyDraft): PolicyDocument {
  if (read.hasDraft) return read.document;
  const baseline = read.canonicalBaseline;
  return {
    global: { ...baseline.global, price: policyPrice(baseline.global.price) },
    cityOverrides: baseline.editions.map<PolicyCityOverride>(edition => {
      const flags = edition.override;
      const values = edition.localValues;
      let price: PolicyOverride<PolicyPricedValue> = { enabled: false, value: null };
      if (flags.price) {
        const value = policyPrice(values.price);
        assertEdgeContract(value.amount !== null, 'policyDocument', 'a non-null enabled local price');
        price = { enabled: true, value };
      }
      let signup: PolicyCityOverride['overrides']['signup'] = { enabled: false, value: null };
      if (flags.signup) {
        assertEdgeContract(values.participantSignupKind !== null && values.signupRequired !== null,
          'policyDocument', 'a complete enabled signup override');
        signup = { enabled: true, value: { kind: values.participantSignupKind, required: values.signupRequired } };
      }
      return { editionId: edition.editionId, overrides: {
        price,
        cover: flags.cover ? { enabled: true, value: values.coverImagePath } : { enabled: false, value: null },
        signup,
        sessionCapacityCeiling: flags.sessionCapacityCeiling
          ? { enabled: true, value: values.sessionCapacityCeiling } : { enabled: false, value: null },
        wholeEventCapacity: flags.wholeEventCapacity
          ? { enabled: true, value: values.wholeEventCapacity } : { enabled: false, value: null },
      } };
    }).sort((a, b) => a.editionId.localeCompare(b.editionId)),
  };
}

export function mapEventPolicyPrice(form: ReturnType<typeof createEventPolicyPriceForm>, source: PolicyDocument): PolicyDocument {
  const price = policyPrice(form.getRawValue());
  return { ...source, global: { ...source.global, price } };
}

function capacityControl(value: number | null) {
  return new FormControl(value, { validators: [integerValidator(), Validators.min(1), Validators.max(2147483647)] });
}

function createPolicyCityRules(row: PolicyCityOverride, global: PolicyDocument['global']) {
  const overrides = row.overrides;
  const signup = overrides.signup.enabled ? overrides.signup.value
    : { kind: global.participantSignupKind, required: global.signupRequired };
  return new FormGroup({
    editionId: new FormControl({ value: row.editionId, disabled: true }, { nonNullable: true }),
    signup: new FormGroup({
      enabled: new FormControl(overrides.signup.enabled, { nonNullable: true }),
      value: new FormGroup({
        kind: new FormControl(signup.kind, { nonNullable: true, validators: [Validators.required, signupKindValidator] }),
        required: new FormControl(signup.required, { nonNullable: true }),
      }),
    }),
    sessionCapacityCeiling: new FormGroup({
      enabled: new FormControl(overrides.sessionCapacityCeiling.enabled, { nonNullable: true }),
      value: capacityControl(overrides.sessionCapacityCeiling.value),
    }),
    wholeEventCapacity: new FormGroup({
      enabled: new FormControl(overrides.wholeEventCapacity.enabled, { nonNullable: true }),
      value: capacityControl(overrides.wholeEventCapacity.value),
    }),
  });
}

export function createEventPolicyRulesForm(source?: PolicyDocument) {
  const global = source?.global;
  const form = new FormGroup({
    global: new FormGroup({
      participantSignupKind: new FormControl(global?.participantSignupKind ?? ParticipantSignupKind.ProgramItem,
        { nonNullable: true, validators: [Validators.required, signupKindValidator] }),
      signupRequired: new FormControl(global?.signupRequired ?? false, { nonNullable: true }),
      sessionCapacityCeiling: capacityControl(global?.sessionCapacityCeiling ?? null),
      wholeEventCapacity: capacityControl(global?.wholeEventCapacity ?? null),
    }),
    cityOverrides: new FormArray(source ? source.cityOverrides.map(row => createPolicyCityRules(row, source.global)) : []),
  });
  form.addValidators(() => {
    const value = form.getRawValue();
    const global = value.global;
    if (!compatibleCapacities(global.participantSignupKind, global.sessionCapacityCeiling, global.wholeEventCapacity)) {
      return { policyCapacity: true };
    }
    return value.cityOverrides.every(row => compatibleCapacities(
      row.signup.enabled ? row.signup.value.kind : global.participantSignupKind,
      row.sessionCapacityCeiling.enabled ? row.sessionCapacityCeiling.value : global.sessionCapacityCeiling,
      row.wholeEventCapacity.enabled ? row.wholeEventCapacity.value : global.wholeEventCapacity,
    )) ? null : { policyCapacity: true };
  });
  return form;
}

export function mapEventPolicyRules(form: ReturnType<typeof createEventPolicyRulesForm>, source: PolicyDocument): PolicyDocument {
  const value = form.getRawValue();
  const cityOverrides = source.cityOverrides.map<PolicyCityOverride>(row => {
    const edited = value.cityOverrides.find(candidate => candidate.editionId === row.editionId);
    assertEdgeContract(edited !== undefined, 'policyRules', 'the existing Edition override row');
    return { ...row, overrides: {
      ...row.overrides,
      signup: edited.signup.enabled ? { enabled: true, value: { ...edited.signup.value } } : { enabled: false, value: null },
      sessionCapacityCeiling: edited.sessionCapacityCeiling.enabled
        ? { enabled: true, value: edited.sessionCapacityCeiling.value } : { enabled: false, value: null },
      wholeEventCapacity: edited.wholeEventCapacity.enabled
        ? { enabled: true, value: edited.wholeEventCapacity.value } : { enabled: false, value: null },
    } };
  });
  return { ...source, global: { ...source.global, ...value.global }, cityOverrides };
}

function signupKindValidator(control: AbstractControl) {
  return Object.values(ParticipantSignupKind).includes(control.value) ? null : { signupKind: true };
}

function compatibleCapacities(kind: ParticipantSignupKind, session: number | null, whole: number | null): boolean {
  return (kind !== ParticipantSignupKind.WholeEvent || session === null) &&
    (kind !== ParticipantSignupKind.ProgramItem || whole === null);
}

function policyPrice(price: Omit<EventGlobalPrice, 'currency'> & { currency: EventCurrency | null }): PolicyPrice {
  const { amount, currency, basis } = price;
  assertEdgeContract(currency !== null && EVENT_CURRENCIES.includes(currency) &&
    (amount === null ? basis === null : typeof amount === 'number' && Number.isFinite(amount) &&
      amount >= 0 && amount < 100000000 && basis !== null && EVENT_PRICE_BASES.includes(basis)),
  'policyPrice', 'the canonical amount/currency/basis, with basis null exactly when amount is null');
  if (amount === null) return { amount, currency, basis: null };
  assertEdgeContract(basis !== null, 'policyPrice', 'a priced value basis');
  return { amount, currency, basis };
}

export function samePolicyDocument(left: PolicyDocument, right: PolicyDocument): boolean {
  const key = (document: PolicyDocument): string => {
    const global = document.global;
    return JSON.stringify([
      global.price.amount, global.price.currency, global.price.basis, global.coverImagePath, global.isForBeginners,
      global.participantSignupKind, global.signupRequired, global.sessionCapacityCeiling, global.wholeEventCapacity,
      [...document.cityOverrides].sort((a, b) => a.editionId.localeCompare(b.editionId)).map(({ editionId, overrides: o }) => [
        editionId, o.price.enabled, o.price.value === null ? null : [o.price.value.amount, o.price.value.currency, o.price.value.basis],
        o.cover.enabled, o.cover.value, o.signup.enabled, o.signup.value === null ? null : [o.signup.value.kind, o.signup.value.required],
        o.sessionCapacityCeiling.enabled, o.sessionCapacityCeiling.value, o.wholeEventCapacity.enabled, o.wholeEventCapacity.value,
      ]),
    ]);
  };
  return key(left) === key(right);
}

export function assertPolicyDocument(document: PolicyDocument, editionIds: readonly string[]): void {
  const global = document.global;
  assertEdgeContract(exactKeys(document, ['global', 'cityOverrides']) && exactKeys(global, ['price', 'coverImagePath',
    'isForBeginners', 'participantSignupKind', 'signupRequired', 'sessionCapacityCeiling', 'wholeEventCapacity']) &&
    typeof global.isForBeginners === 'boolean' && typeof global.signupRequired === 'boolean' &&
    Object.values(ParticipantSignupKind).includes(global.participantSignupKind) &&
    nullablePath(global.coverImagePath) && nullableCapacity(global.sessionCapacityCeiling) && nullableCapacity(global.wholeEventCapacity),
  'policyDocument', 'the complete canonical global policy');
  policyPrice(global.price);
  assertEdgeContract(exactKeys(global.price, ['amount', 'currency', 'basis']) && Array.isArray(document.cityOverrides) &&
    document.cityOverrides.length === editionIds.length && new Set(editionIds).size === editionIds.length &&
    new Set(document.cityOverrides.map(row => row.editionId)).size === editionIds.length &&
    document.cityOverrides.every(row => editionIds.includes(row.editionId)), 'policyDocument', 'one override row per Edition');
  for (const row of document.cityOverrides) {
    const o = row.overrides;
    const groups = ['price', 'cover', 'signup', 'sessionCapacityCeiling', 'wholeEventCapacity'] as const;
    assertEdgeContract(exactKeys(row, ['editionId', 'overrides']) && exactKeys(o, groups) && groups.every(group => {
      const node = o[group];
      return exactKeys(node, ['enabled', 'value']) && typeof node.enabled === 'boolean' && (node.enabled || node.value === null);
    }), 'policyDocument', 'five explicit enabled/value groups, including disabled null values');
    if (o.price.enabled) {
      const value = policyPrice(o.price.value);
      assertEdgeContract(value.amount !== null && exactKeys(o.price.value, ['amount', 'currency', 'basis']),
        'policyDocument', 'a complete enabled local price');
    }
    assertEdgeContract((!o.cover.enabled || nullablePath(o.cover.value)) &&
      (!o.signup.enabled || (exactKeys(o.signup.value, ['kind', 'required']) &&
        Object.values(ParticipantSignupKind).includes(o.signup.value.kind) && typeof o.signup.value.required === 'boolean')) &&
      (!o.sessionCapacityCeiling.enabled || nullableCapacity(o.sessionCapacityCeiling.value)) &&
      (!o.wholeEventCapacity.enabled || nullableCapacity(o.wholeEventCapacity.value)),
    'policyDocument', 'canonical active override values, with explicit null cover/capacity preserved');
  }
}

function exactKeys(value: unknown, keys: readonly string[]): boolean {
  return typeof value === 'object' && value !== null && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function nullablePath(value: string | null): boolean { return value === null || typeof value === 'string'; }
function nullableCapacity(value: number | null): boolean {
  return value === null || (Number.isInteger(value) && value > 0 && value <= 2147483647);
}
