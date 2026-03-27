import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { ISessionListLabels, ISessionWithRelations } from '../../../core/interfaces/i-session';
import { SessionDifficultyLevel } from '../../../core/types/sessions';
import { SessionDetails } from '../session-details/session-details';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    ButtonModule,
    TableModule,
    SessionDetails,
  ],
  templateUrl: './session-list.html',
  styleUrl: './session-list.scss',
})
export class SessionList {
  readonly sessions = input.required<ISessionWithRelations[]>();

  readonly labels = input.required<ISessionListLabels>();
  readonly emptyTitle = input.required<string>();
  readonly emptyDescription = input.required<string>();

  readonly rows = input<number>(10);
  readonly rowsPerPageOptions = input<number[]>([10, 20, 50]);

  readonly showActions = input<boolean>(false);
  readonly busy = input<boolean>(false);

  readonly resolveDifficultyLabel =
    input.required<(value: SessionDifficultyLevel) => string>();

  readonly playersLabel =
    input.required<(minPlayers: number, maxPlayers: number) => string>();

  readonly minAgeLabel = input.required<(minAge: number) => string>();

  readonly edit = output<string>();
  readonly delete = output<string>();

  readonly hasActions = computed(() => this.showActions());
  readonly colspan = computed(() => (this.hasActions() ? 7 : 6));

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

  onEdit(sessionId: string): void {
    if (!this.hasActions()) {
      return;
    }

    this.edit.emit(sessionId);
  }

  onDelete(sessionId: string): void {
    if (!this.hasActions()) {
      return;
    }

    this.delete.emit(sessionId);
  }
}