import { Component, computed, inject, input } from '@angular/core';

import { ParticipantSignupKind } from '../../../../core/enums/event';
import type { EventGlobalPolicyInput } from '../../../../core/interfaces/i-admin-global-event';
import { Storage } from '../../../../core/services/storage/storage';
import { formatMoney } from '../../../../core/utils/pricing';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { resolveParticipantSignupKindLabel } from '../participant-signup-kind-options';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-global-policy-summary',
  templateUrl: './event-global-policy-summary.html',
})
export class EventGlobalPolicySummary {
  readonly policy = input.required<EventGlobalPolicyInput>();
  private readonly storage = inject(Storage);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly rows = computed(() => this.policyRows(this.policy()));

  private policyRows(policy: EventGlobalPolicyInput) {
    const copy = this.i18n.creation();
    const values = this.i18n.commonValues();
    const priceCopy = this.i18n.commonPrice();
    const { amount, currency, basis } = policy.price;
    return [
      { label: this.i18n.commonLabels().price, value: amount === null || amount === 0
        ? priceCopy.presentation.free : formatMoney(amount, currency) },
      ...(amount !== null && amount > 0 ? [
        { label: priceCopy.editor.fields.perUnit, value: basis === null ? values.notApplicable : this.i18n.priceBases()[basis] },
      ] : []),
      { label: this.i18n.commonLabels().forBeginners, value: policy.isForBeginners ? values.yes : values.no },
      { label: this.i18n.commonLabels().participantSignupKind, value: resolveParticipantSignupKindLabel(policy.participantSignupKind, this.i18n.participantKinds()) },
      { label: this.i18n.commonLabels().signupRequired, value: policy.signupRequired ? values.yes : values.no },
      { label: copy.sessionCapacityCeiling, value: policy.participantSignupKind === ParticipantSignupKind.WholeEvent
        ? values.notApplicable : String(policy.sessionCapacityCeiling ?? copy.noAdditionalLimit) },
      { label: copy.wholeEventCapacity, value: policy.participantSignupKind === ParticipantSignupKind.ProgramItem
        ? values.notApplicable : String(policy.wholeEventCapacity ?? copy.noAdditionalLimit) },
      { label: this.i18n.commonLabels().cover, value: policy.coverImagePath ? this.i18n.commonActions().preview : values.notProvided,
        previewUrl: resolvePublicStorageUrl(this.storage, policy.coverImagePath) },
    ];
  }
}
