import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { provideTranslocoScope } from '@jsverse/transloco';

import {
  ISessionListLabels,
  ISessionWithRelations,
} from '../../../core/interfaces/i-session';
import { SessionDifficultyLevel } from '../../../core/types/sessions';
import { SessionDetails } from '../session-details/session-details';
import { createSessionListI18n } from './session-list.i18n';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    ButtonModule,
    ConfirmDialogModule,
    TableModule,
    SessionDetails,
  ],
  templateUrl: './session-list.html',
  styleUrl: './session-list.scss',
  providers: [provideTranslocoScope('common', 'sessions')],
})
export class SessionList {
  private static nextConfirmId = 0;

  private readonly confirmation = inject(ConfirmationService);

  readonly sessions = input.required<ISessionWithRelations[]>();

  readonly labels = input.required<ISessionListLabels>();
  readonly emptyTitle = input.required<string>();
  readonly emptyDescription = input.required<string>();

  readonly rows = input<number>(10);
  readonly rowsPerPageOptions = input<number[]>([10, 20, 50]);

  readonly showActions = input<boolean>(false);
  readonly busy = input<boolean>(false);

  readonly selectable = input<boolean>(false);
  readonly selectedSessionId = input<string | null>(null);
  readonly selectLabel = input<string>('');
  readonly gmDisplayName = input<string | null>(null);

  readonly actionLabel = input<string>('');
  readonly actionSeverity = input<'secondary' | 'success' | 'danger'>(
    'secondary',
  );
  readonly actionOutlined = input<boolean>(true);

  readonly resolveDifficultyLabel =
    input.required<(value: SessionDifficultyLevel) => string>();

  readonly playersLabel =
    input.required<(minPlayers: number, maxPlayers: number) => string>();

  readonly minAgeLabel = input.required<(minAge: number) => string>();

  readonly edit = output<string>();
  readonly delete = output<string>();
  readonly select = output<string>();
  readonly action = output<string>();

  readonly i18n = createSessionListI18n();
  readonly deleteConfirmKey = `session-list-delete-${SessionList.nextConfirmId++}`;

  readonly hasActions = computed(() => this.showActions());
  readonly hasSelection = computed(() => this.selectable());
  readonly hasAction = computed(() => !!this.actionLabel().trim());

  readonly colspan = computed(() => {
    let columns = 6;

    if (this.hasSelection()) {
      columns += 1;
    }

    if (this.hasAction()) {
      columns += 1;
    }

    if (this.hasActions()) {
      columns += 1;
    }

    return columns;
  });

  readonly sortedSessions = computed(() =>
    [...this.sessions()].sort((a, b) => {
      const systemA = a.system?.name ?? '';
      const systemB = b.system?.name ?? '';
      const systemCompare = systemA.localeCompare(systemB, 'pl');

      if (systemCompare !== 0) {
        return systemCompare;
      }

      return a.title.localeCompare(b.title, 'pl');
    }),
  );

  isSelected(sessionId: string): boolean {
    return this.selectedSessionId() === sessionId;
  }

  onSelect(sessionId: string): void {
    if (!this.hasSelection()) {
      return;
    }

    this.select.emit(sessionId);
  }

  onAction(sessionId: string): void {
    if (!this.hasAction()) {
      return;
    }

    this.action.emit(sessionId);
  }

  onEdit(sessionId: string): void {
    if (!this.hasActions()) {
      return;
    }

    this.edit.emit(sessionId);
  }

  onDelete(sessionId: string): void {
    if (!this.hasActions() || this.busy()) {
      return;
    }

    this.confirmation.confirm({
      key: this.deleteConfirmKey,
      header: this.i18n.dialog().sure,
      message: this.i18n.dialog().deleteSession,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      rejectVisible: true,
      acceptLabel: this.i18n.actions().yes,
      rejectLabel: this.i18n.actions().no,
      accept: () => {
        this.delete.emit(sessionId);
      },
      acceptButtonProps: {
        severity: 'danger',
      },
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true,
      },
    });
  }
}
