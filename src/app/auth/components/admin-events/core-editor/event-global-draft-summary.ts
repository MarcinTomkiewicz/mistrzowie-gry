import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import type {
  AdminEffectivePolicyResult, AdminGlobalCalendarResult,
} from '../../../../core/interfaces/i-admin-global-event';
import type { IAdminEventDetail, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminEventPolicyDraft } from '../../../../core/interfaces/i-admin-event-policy';
import type { AdminGlobalEventPageFieldError } from '../../../../core/interfaces/i-admin-global-event-preview';
import { formatDateLabel } from '../../../../core/utils/date';
import { formatMoney } from '../../../../core/utils/pricing';
import { Storage } from '../../../../core/services/storage/storage';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { resolveParticipantSignupKindLabel } from '../participant-signup-kind-options';
import type { ParticipantSignupKind } from '../../../../core/enums/event';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalPolicySummary } from './policy/event-global-policy-summary';
import { projectEventGlobalSummaryDates, type EventGlobalSummaryChanges } from './event-global-summary-changes';
import { EventGlobalTimeBlocksSummary } from './event-global-time-blocks-summary';
import { EventGlobalDiagnosticMessages, selectEventGlobalDiagnosticIssues } from './event-global-diagnostic-messages';

@Component({
  selector: 'app-event-global-draft-summary',
  imports: [ButtonModule, EventGlobalPolicySummary, EventGlobalTimeBlocksSummary, EventGlobalDiagnosticMessages],
  templateUrl: './event-global-draft-summary.html',
  host: { class: 'flex-col-start-stretch gap-md w-100 min-w-0' },
})
export class EventGlobalDraftSummary {
  readonly step = input(6);
  readonly core = input.required<IEventCoreDetail>();
  readonly edition = input.required<IAdminEventDetail>();
  readonly calendar = input.required<AdminGlobalCalendarResult>();
  readonly policy = input.required<AdminEffectivePolicyResult>();
  readonly policyDraft = input<AdminEventPolicyDraft | null>(null);
  readonly changes = input<EventGlobalSummaryChanges | null>(null);
  readonly disabled = input(false);
  readonly editableSteps = input<readonly number[]>([]);
  readonly fieldErrors = input<readonly AdminGlobalEventPageFieldError[]>([]);
  readonly navigateToStep = output<number>();
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatMoney = formatMoney;
  protected readonly coreView = computed(() => ({ ...this.core(), ...this.changes()?.core }));
  protected readonly editionView = computed(() => ({ ...this.edition(), ...this.changes()?.edition }));
  private readonly storage = inject(Storage);
  protected readonly coverUrl = computed(() => resolvePublicStorageUrl(this.storage,
    this.editionView().coverImagePath ?? this.coreView().coverImagePath));
  protected readonly baseBlocks = computed(() => this.changes()?.base ?? this.calendar().timeBlocks);
  protected readonly locationCity = computed(() => this.calendar().cities.find((city) => city.editionId === this.edition().id));
  protected readonly dates = computed(() => projectEventGlobalSummaryDates(this.calendar(), this.changes()));
  protected readonly localPolicy = computed(() => this.changes()?.policy);
  protected readonly locationIssues = computed(() => this.issues(['editionDrafts'], this.step() === 6 ? undefined : this.edition().id));
  protected readonly cityOverrides = computed(() => this.localPolicy()?.cityOverrides ??
    (this.policyDraft()?.baselineChanged ? [] : this.policyDraft()?.document?.cityOverrides ?? []));
  protected readonly policyGroups = computed(() => {
    const local = this.localPolicy();
    if (local) return [{ key: 'local', title: this.i18n.creationSteps().policy, values: local.global }];
    const draft = this.policyDraft();
    if (draft?.hasDraft && !draft.baselineChanged) return [{ key: 'draft', title: this.i18n.creationSteps().policy, values: draft.document.global }];
    return [
      { key: 'global', title: this.i18n.creationSteps().policy, values: this.policy().global },
      ...this.policy().editions.filter(edition => Object.values(edition.override).some(Boolean)).map(edition => ({
        key: edition.editionId, title: `${this.i18n.creation().effectivePolicy} - ${edition.city}`, values: edition.effective,
      })),
    ];
  });

  protected signupLabel(kind: ParticipantSignupKind): string {
    return resolveParticipantSignupKindLabel(kind, this.i18n.participantKinds());
  }

  protected issues(fields: readonly AdminGlobalEventPageFieldError['field'][], editionId?: string) {
    return selectEventGlobalDiagnosticIssues(this.fieldErrors(), fields, editionId);
  }

  protected cityName(editionId: string): string | undefined {
    return this.policy().editions.find(city => city.editionId === editionId)?.city;
  }
}
