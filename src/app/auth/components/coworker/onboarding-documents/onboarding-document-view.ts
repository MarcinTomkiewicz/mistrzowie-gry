import type { ICoworkerPrivateDocument } from '../../../../core/interfaces/i-coworker-onboarding';
import type { CoworkerDocumentDownloadTarget } from '../../../../core/types/coworker-onboarding';

export interface PrivateDocumentRow {
  readonly document: ICoworkerPrivateDocument;
  readonly historical: boolean;
}

export interface DocumentFileRequest {
  readonly assignmentId: string;
  readonly target: CoworkerDocumentDownloadTarget;
  readonly preview: boolean;
}
