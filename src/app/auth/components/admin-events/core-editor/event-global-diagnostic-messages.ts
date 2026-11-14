import { Component, input } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';

import type { AdminGlobalEventPageFieldError } from '../../../../core/interfaces/i-admin-global-event-preview';
import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { EventGlobalDiagnosticIssue } from '../../../../core/interfaces/i-event-global-saved-summary';
import { isRecord } from '../../../../core/utils/is-record';
import { createEventCoreEditorI18n } from './core-editor.i18n';

export function selectEventGlobalDiagnosticIssues(issues: readonly AdminGlobalEventPageFieldError[],
  fields: readonly AdminGlobalEventPageFieldError['field'][], editionId?: string) {
  return issues.filter(issue => fields.includes(issue.field) &&
    (editionId === undefined || !('editionId' in issue) || issue.editionId === editionId));
}

type DiagnosticI18n = ReturnType<typeof createEventCoreEditorI18n>;
type DiagnosticCities = readonly AdminGlobalCalendarResult['cities'][number][];

export function eventGlobalDiagnosticField(path: string, i18n: DiagnosticI18n): string | null {
  if (!path) return null;
  const labels = i18n.commonLabels();
  const names: Record<string, string> = { ...labels, global: i18n.creationSteps().policy,
    price: labels.price, amount: labels.amount, basis: i18n.commonPrice().editor.fields.perUnit,
    rules: i18n.creationSteps().policy, timeBlocks: i18n.creation().blocks, position: labels.order,
    kind: path.includes('signup') ? labels.signupKind : labels.scheduleKind, required: labels.signupRequired,
    label: i18n.creation().blockLabel, requiredGmCount: i18n.creation().requiredGmCount,
    sessionCapacityCeiling: i18n.creation().sessionCapacityCeiling, wholeEventCapacity: i18n.creation().wholeEventCapacity,
    cityOverrides: i18n.policyEditor().cityOverrides, signup: labels.participantSignupKind,
    startDate: labels.from, endDate: labels.to, ...i18n.diagnostics().fieldLabels };
  const parts = path.split(/[.\[\]]/).filter(Boolean).reverse();
  const field = parts.find(part => Object.hasOwn(names, part));
  const index = path.match(/(?:\.|\[)(\d+)(?:\.|\]|$)/)?.[1];
  return field ? `${names[field]}${index === undefined ? '' : ` (${Number(index) + 1})`}` : null;
}

export function eventGlobalValidationIssues(control: AbstractControl, i18n: DiagnosticI18n,
  cities: DiagnosticCities, path = '', location: string | null = null): EventGlobalDiagnosticIssue[] {
  if (control.disabled) return [];
  if (control instanceof FormGroup) {
    const editionId: unknown = control.get('editionId')?.value;
    if (typeof editionId === 'string') location = cities.find(city => city.editionId === editionId)?.city ?? editionId;
  }
  const issues = Object.entries<unknown>(control.errors ?? {}).map(([code, data]): EventGlobalDiagnosticIssue => {
    const rules = i18n.diagnostics().rules;
    let message = Object.entries(rules).find(([key]) => key === code)?.[1] ?? rules.unknown;
    if (code === 'policyCapacity') message = i18n.policyEditor().capacityConflict;
    const limit = isRecord(data) ? data[code === 'min' ? 'min' : code === 'max' ? 'max' : 'requiredLength'] : null;
    if (typeof limit === 'number') message += ` (${limit})`;
    return { field: eventGlobalDiagnosticField(path, i18n), location, message, code,
      technical: JSON.stringify({ path, code, data }) };
  });
  if (control instanceof FormGroup) {
    for (const [name, child] of Object.entries<AbstractControl>(control.controls)) {
      issues.push(...eventGlobalValidationIssues(child, i18n, cities, path ? `${path}.${name}` : name, location));
    }
  } else if (control instanceof FormArray) {
    control.controls.forEach((child: AbstractControl, index: number) =>
      issues.push(...eventGlobalValidationIssues(child, i18n, cities, `${path}.${index}`, location)));
  }
  return issues;
}

export function eventGlobalServerIssue(value: unknown, i18n: DiagnosticI18n, cities: DiagnosticCities): EventGlobalDiagnosticIssue {
  const text = (key: string): string | null => isRecord(value) && typeof value[key] === 'string' ? value[key] : null;
  const code = text('code');
  const editionId = text('editionId') ?? cities.find(city => text('field')?.includes(city.editionId))?.editionId;
  const message = Object.entries(i18n.diagnostics().messages).find(([key]) => key === code)?.[1]
    ?? i18n.diagnostics().noReason;
  return { field: eventGlobalDiagnosticField(text('field') ?? '', i18n),
    location: editionId ? cities.find(city => city.editionId === editionId)?.city ?? editionId : null,
    message, code, technical: JSON.stringify(value) ?? null };
}

@Component({
  selector: 'app-event-global-diagnostic-messages',
  template: `
    @for (issue of issues(); track $index) {
      <p class="error-text m-0 text-wrap-anywhere" role="status">
        @if ('editionId' in issue && cities().length) { <strong>{{ cityName(issue.editionId) }}: </strong> }
        {{ i18n.diagnostics().messages[issue.code] }}
      </p>
    }
  `,
  host: { class: 'd-contents' },
})
export class EventGlobalDiagnosticMessages {
  readonly issues = input<readonly AdminGlobalEventPageFieldError[]>([]);
  readonly cities = input<AdminGlobalCalendarResult['cities']>([]);
  protected readonly i18n = createEventCoreEditorI18n();

  protected cityName(editionId: string): string {
    return this.cities().find(city => city.editionId === editionId)?.city ?? editionId;
  }
}
