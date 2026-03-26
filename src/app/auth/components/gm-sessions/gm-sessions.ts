import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import {
  ICreateSessionPayload,
  ISessionFormData,
  ISessionWithRelations,
  IUpdateSessionPayload,
} from '../../../core/interfaces/i-session';
import { IContentTrigger } from '../../../core/interfaces/i-content-trigger';
import { IGmStyle } from '../../../core/interfaces/i-gm-style';
import { ISystem } from '../../../core/interfaces/i-system';
import { SessionDifficultyLevel } from '../../../core/types/sessions';
import { GmSessionsFacade } from '../../../core/services/gm-sessions/gm-sessions';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { SessionForm } from '../../common/session-form/session-form';
import { SessionDetails } from '../../common/session-details/session-details';
import { createGmSessionsI18n } from './gm-sessions.i18n';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';

@Component({
  selector: 'app-gm-sessions',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    SessionForm,
    SessionDetails,
    LoadingOverlay,
  ],
  templateUrl: './gm-sessions.html',
  styleUrl: './gm-sessions.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class GmSessions {
  private readonly gmSessionsFacade = inject(GmSessionsFacade);
  private readonly toast = inject(UiToast);

  readonly i18n = createGmSessionsI18n();

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  readonly sessions = signal<ISessionWithRelations[]>([]);
  readonly systems = signal<ISystem[]>([]);
  readonly styles = signal<IGmStyle[]>([]);
  readonly triggers = signal<IContentTrigger[]>([]);

  readonly editedSessionId = signal<string | null>(null);
  readonly isCreateMode = signal(false);

  readonly rowsPerPageOptions = [10, 20, 50];

  readonly editedSession = computed(() =>
    this.sessions().find((session) => session.id === this.editedSessionId()) ?? null,
  );

  readonly isEditing = computed(() => !!this.editedSessionId());
  readonly isFormVisible = computed(() => this.isCreateMode() || this.isEditing());

  readonly initialFormData = computed<Partial<ISessionFormData> | null>(() => {
    const session = this.editedSession();

    if (!session) {
      return null;
    }

    return {
      systemId: session.systemId,
      title: session.title,
      description: session.description,
      image: session.image,
      difficultyLevel: session.difficultyLevel,
      minPlayers: session.minPlayers,
      maxPlayers: session.maxPlayers,
      minAge: session.minAge,
      triggerIds: session.triggers.map((trigger) => trigger.id),
      gmStyleIds: session.styles.map((style) => style.id),
      sortOrder: session.sortOrder,
    };
  });

  readonly tableSessions = computed(() =>
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

  constructor() {
    this.loadData();
  }

  startCreate(): void {
    this.isCreateMode.set(true);
    this.editedSessionId.set(null);
  }

  startEdit(sessionId: string): void {
    this.isCreateMode.set(false);
    this.editedSessionId.set(sessionId);
  }

  cancelEdition(): void {
    this.isCreateMode.set(false);
    this.editedSessionId.set(null);
  }

  saveSession(payload: ICreateSessionPayload | IUpdateSessionPayload): void {
    this.isSubmitting.set(true);

    const request$ = this.isEditing() && this.editedSessionId()
      ? this.gmSessionsFacade.updateMySessionTemplate(this.editedSessionId()!, payload)
      : this.gmSessionsFacade.createMySessionTemplate(payload);

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (session) => {
          this.sessions.update((sessions) => {
            const hasExisting = sessions.some((item) => item.id === session.id);

            if (!hasExisting) {
              return [...sessions, session];
            }

            return sessions.map((item) => (item.id === session.id ? session : item));
          });

          this.cancelEdition();

          this.toast.success({
            summary: this.i18n.toastSaveSuccessSummary(),
            detail: this.i18n.toastSaveSuccessDetail(),
          });
        },
        error: (error) => {
          console.error('[GM SESSIONS SAVE ERROR]', error);

          this.toast.danger({
            summary: this.i18n.toastSaveFailedSummary(),
            detail: this.i18n.toastSaveFailedDetail(),
          });
        },
      });
  }

  deleteSession(sessionId: string): void {
    this.isSubmitting.set(true);

    this.gmSessionsFacade
      .deleteMySessionTemplate(sessionId)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.sessions.update((sessions) =>
            sessions.filter((session) => session.id !== sessionId),
          );

          if (this.editedSessionId() === sessionId) {
            this.cancelEdition();
          }

          this.toast.success({
            summary: this.i18n.toastDeleteSuccessSummary(),
            detail: this.i18n.toastDeleteSuccessDetail(),
          });
        },
        error: (error) => {
          console.error('[GM SESSIONS DELETE ERROR]', error);

          this.toast.danger({
            summary: this.i18n.toastDeleteFailedSummary(),
            detail: this.i18n.toastDeleteFailedDetail(),
          });
        },
      });
  }

  resolveDifficultyLabel(value: SessionDifficultyLevel): string {
    switch (value) {
      case SessionDifficultyLevel.Beginner:
        return this.i18n.beginnerDifficultyLabel();
      case SessionDifficultyLevel.Intermediate:
        return this.i18n.intermediateDifficultyLabel();
      case SessionDifficultyLevel.Advanced:
        return this.i18n.advancedDifficultyLabel();
    }
  }

  private loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      sessions: this.gmSessionsFacade.getMySessionTemplates(),
      systems: this.gmSessionsFacade.getAvailableSystems(),
      styles: this.gmSessionsFacade.getAvailableStyles(),
      triggers: this.gmSessionsFacade.getAvailableTriggers(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ sessions, systems, styles, triggers }) => {
          this.sessions.set(sessions);
          this.systems.set(systems);
          this.styles.set(styles);
          this.triggers.set(triggers);
        },
        error: (error) => {
          console.error('[GM SESSIONS LOAD ERROR]', error);

          this.toast.danger({
            summary: this.i18n.toastLoadFailedSummary(),
            detail: this.i18n.toastLoadFailedDetail(),
          });
        },
      });
  }
}