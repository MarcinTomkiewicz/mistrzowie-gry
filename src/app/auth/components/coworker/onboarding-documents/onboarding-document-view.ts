import type { MenuItem } from 'primeng/api';

import type { ICoworkerPrivateDocument } from '../../../../core/interfaces/i-coworker-onboarding';
import type {
  CoworkerDocumentDownloadTarget,
  CoworkerDocumentRequiredAction,
} from '../../../../core/types/coworker-onboarding';
import type { CoworkerOnboardingActionsTranslations } from '../../../../core/types/i18n/coworker-onboarding';

type PendingDocumentAction = Exclude<CoworkerDocumentRequiredAction, 'none'>;

export interface PrivateDocumentRow {
  readonly document: ICoworkerPrivateDocument;
  readonly historical: boolean;
  readonly pendingAction: PendingDocumentAction | null;
}

export interface DocumentFileRequest {
  readonly assignmentId: string;
  readonly target: CoworkerDocumentDownloadTarget;
  readonly preview: boolean;
}

export function getPendingDocumentAction(
  document: Pick<ICoworkerPrivateDocument, 'required_action' | 'assignment_status'>,
): PendingDocumentAction | null {
  const { required_action: action, assignment_status: status } = document;
  if (action === 'acknowledge' && status === 'pending') return action;
  if (action === 'upload_signed' && (status === 'pending' || status === 'rejected')) return action;
  return null;
}

export function createDocumentMenu(
  document: Pick<ICoworkerPrivateDocument, 'assignment_id'> &
    Partial<Pick<ICoworkerPrivateDocument, 'signed_original_filename'>>,
  labels: Pick<CoworkerOnboardingActionsTranslations, 'previewSigned' | 'downloadSigned' | 'acknowledgeDocument'>,
  downloadLabel: string,
  requestFile: (event: DocumentFileRequest) => void,
  requestAcknowledgement?: (assignmentId: string) => void,
): MenuItem[] {
  const assignmentId = document.assignment_id;
  const menu: MenuItem[] = [{
    label: downloadLabel, icon: 'pi pi-missile-swarm',
    command: () => requestFile({ assignmentId, target: 'source', preview: false }),
  }];

  if (document.signed_original_filename) {
    menu.push({
      label: labels.previewSigned, icon: 'pi pi-evil-book',
      command: () => requestFile({ assignmentId, target: 'signed', preview: true }),
    }, {
      label: labels.downloadSigned, icon: 'pi pi-missile-swarm',
      command: () => requestFile({ assignmentId, target: 'signed', preview: false }),
    });
  }

  if (requestAcknowledgement) {
    menu.push({
      label: labels.acknowledgeDocument, icon: 'pi pi-done-it',
      command: () => requestAcknowledgement(assignmentId),
    });
  }

  return menu;
}
