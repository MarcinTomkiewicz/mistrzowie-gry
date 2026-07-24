import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import type {
  AdminOperationalTargetProvenance,
  IAdminOperationalAssignmentListItem,
} from '../../../../core/interfaces/i-admin-operational-assignment';
import type { IAdminOperationalCatalog } from '../../../../core/interfaces/i-admin-operational-catalog';
import type {
  CoworkerOperationalAction,
  CoworkerOperationalActionMode,
  CoworkerOperationalAssignmentSource,
  CoworkerOperationalAssignmentStatus,
} from '../../../../core/types/coworker-operational-document';
import { getAppRoleLabel } from '../../../../core/utils/app-role-labels';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import {
  formatAdminOperationalCoworkerLabel,
  resolveAdminOperationalTargetLabel,
} from '../operational-labels';

@Component({
  selector: 'app-admin-operational-assignment-table',
  standalone: true,
  imports: [ButtonModule, TableModule, ContextHelp],
  templateUrl: './assignment-table.html',
})
export class AssignmentTable {
  readonly assignments =
    input.required<IAdminOperationalAssignmentListItem[]>();
  readonly catalog = input.required<IAdminOperationalCatalog>();
  readonly waiverBusy = input(false);
  readonly waiverRequested =
    output<IAdminOperationalAssignmentListItem>();

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatCoworkerLabel =
    formatAdminOperationalCoworkerLabel;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly getAppRoleLabel = getAppRoleLabel;

  protected targetLabel(target: AdminOperationalTargetProvenance): string {
    return resolveAdminOperationalTargetLabel(
      target,
      this.catalog(),
      this.i18n.statuses().targetKinds,
      this.i18n.appRoles(),
    );
  }

  protected canWaive(item: IAdminOperationalAssignmentListItem): boolean {
    const status = item.assignment.status;
    return (
      status === 'available' ||
      status === 'pending' ||
      status === 'declined' ||
      status === 'expired'
    );
  }

  protected requestWaiver(
    item: IAdminOperationalAssignmentListItem,
  ): void {
    if (!this.canWaive(item) || this.waiverBusy()) return;

    this.waiverRequested.emit(item);
  }

  protected assignmentStatusClass(
    status: CoworkerOperationalAssignmentStatus,
  ): string {
    return STATUS_BADGE_CLASS[status];
  }

  protected assignmentStatusLabel(
    status: CoworkerOperationalAssignmentStatus,
  ): string {
    return this.i18n.statuses().assignments[status];
  }

  protected actionModeLabel(
    mode: CoworkerOperationalActionMode,
  ): string {
    return this.i18n.statuses().actionModes[mode];
  }

  protected statementActionLabel(
    action: CoworkerOperationalAction,
  ): string {
    return this.i18n.statuses().statementActions[action];
  }

  protected assignmentSourceLabel(
    source: CoworkerOperationalAssignmentSource,
  ): string {
    return this.i18n.statuses().assignmentSources[source];
  }

  protected targetKindLabel(
    target: AdminOperationalTargetProvenance,
  ): string {
    return this.i18n.statuses().targetKinds[target.targetKind];
  }
}
