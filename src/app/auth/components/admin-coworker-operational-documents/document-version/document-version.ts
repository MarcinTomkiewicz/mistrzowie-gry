import { Component, input } from '@angular/core';

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

@Component({
  selector: 'app-admin-operational-document-version',
  standalone: true,
  imports: [ContextHelp],
  templateUrl: './document-version.html',
})
export class DocumentVersion {
  readonly version = input.required<AdminOperationalStoredVersion>();
  readonly catalog = input.required<IAdminOperationalCatalog>();
  readonly current = input(false);

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;

  protected targetValue(target: AdminOperationalTarget): string {
    switch (target.targetKind) {
      case 'all_active_coworkers':
        return this.i18n.statuses().targetKinds.all_active_coworkers;
      case 'app_role':
        return this.i18n.statuses().appRoles[target.appRole];
      case 'user': {
        const coworker = this.catalog().coworkers.find(
          (option) => option.userId === target.userId,
        )!;
        return coworker.firstName === null
          ? coworker.email
          : `${coworker.firstName} - ${coworker.email}`;
      }
      case 'event_definition': {
        const eventDefinition = this.catalog().eventDefinitions.find(
          (option) => option.id === target.eventDefinitionId,
        )!;
        return `${eventDefinition.name} - ${eventDefinition.key}`;
      }
    }
  }
}
