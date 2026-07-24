import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import {
  IAdminOperationalCatalog,
} from '../../../../core/interfaces/i-admin-operational-catalog';
import type {
  AdminOperationalStoredVersion,
  AdminOperationalTarget,
} from '../../../../core/types/admin-operational-version';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import { resolveAdminOperationalTargetLabel } from '../operational-labels';

@Component({
  selector: 'app-admin-operational-document-version',
  standalone: true,
  imports: [RouterLink, ButtonModule, ContextHelp],
  templateUrl: './document-version.html',
})
export class DocumentVersion {
  readonly version = input.required<AdminOperationalStoredVersion>();
  readonly catalog = input.required<IAdminOperationalCatalog>();
  readonly current = input(false);
  readonly downloading = input(false);
  readonly downloadRequested = output<AdminOperationalStoredVersion>();

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;

  protected targetLabel(target: AdminOperationalTarget): string {
    return resolveAdminOperationalTargetLabel(
      target,
      this.catalog(),
      this.i18n.statuses().targetKinds,
      this.i18n.appRoles(),
    );
  }
}
