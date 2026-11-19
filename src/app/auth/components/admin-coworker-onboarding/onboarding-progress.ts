import { STATUS_BADGE_CLASS } from '../../../core/configs/badge-class.config';
import type { IAdminCoworkerOnboardingRow } from '../../../core/interfaces/i-admin-coworker-onboarding';
import type { CommonValuesTranslations } from '../../../core/types/i18n/common';
import type {
  CoworkerOnboardingFieldsTranslations,
  CoworkerOnboardingStatusesTranslations,
} from '../../../core/types/i18n/coworker-onboarding';

export function createAdminOnboardingProgress(
  onboarding: IAdminCoworkerOnboardingRow,
  fields: CoworkerOnboardingFieldsTranslations,
  assignments: CoworkerOnboardingStatusesTranslations['assignment'],
  values: Pick<CommonValuesTranslations, 'yes' | 'no'>,
) {
  const questionnaire = [
    { key: 'exists', label: fields.questionnaireExists, value: onboarding.questionnaire_exists },
    { key: 'complete', label: fields.questionnaireComplete, value: onboarding.questionnaire_complete },
    { key: 'validated', label: fields.questionnaireValidated, value: onboarding.questionnaire_validated },
  ];
  const privateDocuments = [
    { key: 'signatures', label: fields.pendingSignatures, value: onboarding.private_pending_signature_count, status: 'pending' },
    { key: 'acknowledgements', label: fields.pendingAcknowledgements, value: onboarding.private_pending_acknowledgement_count, status: 'pending' },
    { key: 'submitted', label: fields.awaitingAdminReview, value: onboarding.private_submitted_count, status: 'submitted' },
    { key: 'rejected', label: assignments.rejected, value: onboarding.private_rejected_count, status: 'rejected' },
    { key: 'accepted', label: assignments.accepted, value: onboarding.private_accepted_count, status: 'accepted' },
  ] as const;
  const sharedDocuments = [
    { key: 'pending', label: fields.pendingAcknowledgements, value: onboarding.shared_pending_acknowledgement_count, status: 'pending' },
    { key: 'acknowledged', label: fields.acknowledgedAssignments, value: onboarding.shared_acknowledged_count, status: 'acknowledged' },
  ] as const;

  return {
    // The private aggregate already includes pending, submitted and rejected assignments.
    pendingActions: onboarding.pending_private_action_count + onboarding.shared_pending_acknowledgement_count,
    questionnaire: questionnaire.map(({ key, label, value }) => ({
      key, label, value: value ? values.yes : values.no,
      badgeClass: `tag-badge ${STATUS_BADGE_CLASS[value ? 'completed' : 'pending']}`,
    })),
    privateDocuments: privateDocuments.map(({ key, label, value, status }) => ({
      key, label, value, badgeClass: `tag-badge ${STATUS_BADGE_CLASS[status]}`,
    })),
    sharedDocuments: sharedDocuments.map(({ key, label, value, status }) => ({
      key, label, value, badgeClass: `tag-badge ${STATUS_BADGE_CLASS[status]}`,
    })),
  };
}
