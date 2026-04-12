import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import {
  ISessionFormInitialData,
  ISessionListLabels,
  ISessionFormSubmitData,
  ISessionWithRelations,
} from '../../../core/interfaces/i-session';
import { IContentTrigger } from '../../../core/interfaces/i-content-trigger';
import { IGmStyle } from '../../../core/interfaces/i-gm-style';
import { ILanguage } from '../../../core/interfaces/i-languages';
import { ISystem } from '../../../core/interfaces/i-system';
import {
  SESSION_DIFFICULTY_LEVEL_OPTIONS,
  SessionDifficultyLevel,
} from '../../../core/types/sessions';
import { Auth } from '../../../core/services/auth/auth';
import { GmSessionsFacade } from '../../../core/services/gm-sessions/gm-sessions';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { normalizeText } from '../../../core/utils/normalize-text';
import { scrollElementIntoViewWhenReady } from '../../../core/utils/scroll';
import { SessionForm } from '../../common/session-form/session-form';
import { createGmSessionsI18n } from './gm-sessions.i18n';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import {
  ISessionListAction,
  SessionList,
} from '../../../public/common/session-list/session-list';

interface ISessionSystemOption {
  id: string | null;
  name: string;
}

@Component({
  selector: 'app-gm-sessions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    SessionForm,
    LoadingOverlay,
    SessionList,
  ],
  templateUrl: './gm-sessions.html',
  styleUrl: './gm-sessions.scss',
  providers: [provideTranslocoScope('auth', 'common', 'sessions')],
})
export class GmSessions {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly gmSessionsFacade = inject(GmSessionsFacade);
  private readonly toast = inject(UiToast);
  private readonly formAnchor = viewChild<ElementRef<HTMLElement>>('formAnchor');

  readonly i18n = createGmSessionsI18n();

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  readonly sessions = signal<ISessionWithRelations[]>([]);
  readonly systems = signal<ISystem[]>([]);
  readonly mySessionSystems = signal<ISystem[]>([]);
  readonly styles = signal<IGmStyle[]>([]);
  readonly triggers = signal<IContentTrigger[]>([]);
  readonly languages = signal<ILanguage[]>([]);

  readonly systemFilterControl = new FormControl<string | null>(null);
  private readonly selectedSystemId = toSignal(this.systemFilterControl.valueChanges, {
    initialValue: this.systemFilterControl.getRawValue(),
  });

  readonly editedSessionId = signal<string | null>(null);
  readonly isCreateMode = signal(false);

  readonly rowsPerPageOptions = [10, 20, 50];
  readonly sessionListActions: readonly ISessionListAction[] = [
    { type: 'edit' },
    { type: 'delete' },
  ];

  readonly editedSession = computed(
    () =>
      this.sessions().find(
        (session) => session.id === this.editedSessionId(),
      ) ?? null,
  );

  readonly isEditing = computed(() => !!this.editedSessionId());
  readonly isFormVisible = computed(
    () => this.isCreateMode() || this.isEditing(),
  );

  readonly initialFormData = computed<ISessionFormInitialData | null>(
    () => this.editedSession(),
  );

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

  readonly filteredSessions = computed(() => {
    const selectedSystemId = this.selectedSystemId();

    if (!selectedSystemId) {
      return this.tableSessions();
    }

    return this.tableSessions().filter(
      (session) => session.systemId === selectedSystemId,
    );
  });

  readonly systemFilterOptions = computed<ISessionSystemOption[]>(() => [
    {
      id: null,
      name: this.i18n.form().systemFilterAllLabel,
    },
    ...this.mySessionSystems().map((system) => ({
      id: system.id,
      name: system.name,
    })),
  ]);

  readonly difficultyLabels = computed<Record<SessionDifficultyLevel, string>>(
    () => {
      const difficulty = this.i18n.difficulty();

      return Object.fromEntries(
        SESSION_DIFFICULTY_LEVEL_OPTIONS.map((option) => [
          option.value,
          difficulty[option.i18nKey],
        ]),
      ) as Record<SessionDifficultyLevel, string>;
    },
  );

  readonly sessionListLabels = computed<ISessionListLabels>(() => ({
    systemLabel: this.i18n.sessionForm().systemLabel,
    titleLabel: this.i18n.sessionForm().titleLabel,
    difficultyLabel: this.i18n.sessionForm().difficultyLabel,
    playersLabel: this.i18n.list().playersHeaderLabel,
    minAgeLabel: this.i18n.list().minAgeHeaderLabel,
    editLabel: this.i18n.commonActions().edit,
    deleteLabel: this.i18n.commonActions().delete,
  }));

  readonly gmDisplayName = computed(
    () => normalizeText(this.auth.displayName()) ?? null,
  );

  constructor() {
    this.loadData();
  }

  startCreate(): void {
    this.isCreateMode.set(true);
    this.editedSessionId.set(null);
    this.scrollToForm();
  }

  startEdit(sessionId: string): void {
    this.isCreateMode.set(false);
    this.editedSessionId.set(sessionId);
    this.scrollToForm();
  }

  cancelEdition(): void {
    this.isCreateMode.set(false);
    this.editedSessionId.set(null);
  }

  saveSession(submit: ISessionFormSubmitData): void {
    this.isSubmitting.set(true);

    const request$ =
      this.isEditing() && this.editedSessionId()
        ? this.gmSessionsFacade.updateMySession(
            this.editedSessionId()!,
            submit,
            'template'
          )
        : this.gmSessionsFacade.createMySession(submit);

    request$
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
      next: (session) => {
        this.sessions.update((sessions) => {
          const hasExisting = sessions.some((item) => item.id === session.id);

          if (!hasExisting) {
            return [...sessions, session];
          }

          return sessions.map((item) =>
            item.id === session.id ? session : item,
          );
        });

        this.refreshMySessionSystems();
        this.cancelEdition();

        this.toast.success({
          summary: this.i18n.toast().saveSuccessSummary,
          detail: this.i18n.toast().saveSuccessDetail,
        });
      },
      error: (error) => {
        console.error('[GM SESSIONS SAVE ERROR]', error);

        this.toast.danger({
          summary: this.i18n.toast().saveFailedSummary,
          detail: this.i18n.toast().saveFailedDetail,
        });
      },
      });
  }

  deleteSession(sessionId: string): void {
    this.isSubmitting.set(true);

    this.gmSessionsFacade
      .deleteMySession(sessionId)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.sessions.update((sessions) =>
            sessions.filter((session) => session.id !== sessionId),
          );

          if (this.editedSessionId() === sessionId) {
            this.cancelEdition();
          }

          this.refreshMySessionSystems();

          this.toast.success({
            summary: this.i18n.toast().deleteSuccessSummary,
            detail: this.i18n.toast().deleteSuccessDetail,
          });
        },
        error: (error) => {
          console.error('[GM SESSIONS DELETE ERROR]', error);

        this.toast.danger({
          summary: this.i18n.toast().deleteFailedSummary,
          detail: this.i18n.toast().deleteFailedDetail,
        });
      },
      });
  }

  resolveDifficultyLabel(value: SessionDifficultyLevel): string {
    return this.difficultyLabels()[value];
  }

  private loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      sessions: this.gmSessionsFacade.getMySessions(),
      systems: this.gmSessionsFacade.getAvailableSystems(),
      mySessionSystems: this.gmSessionsFacade.getMySessionSystems(),
      styles: this.gmSessionsFacade.getAvailableStyles(),
      triggers: this.gmSessionsFacade.getAvailableTriggers(),
      languages: this.gmSessionsFacade.getAvailableLanguages(),
    })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ sessions, systems, mySessionSystems, styles, triggers, languages }) => {
          this.sessions.set(sessions);
          this.systems.set(systems);
          this.mySessionSystems.set(mySessionSystems);
          this.styles.set(styles);
          this.triggers.set(triggers);
          this.languages.set(languages);

          this.ensureSelectedSystemStillExists();
        },
        error: (error) => {
          console.error('[GM SESSIONS LOAD ERROR]', error);

        this.toast.danger({
          summary: this.i18n.toast().loadFailedSummary,
          detail: this.i18n.toast().loadFailedDetail,
        });
      },
      });
  }

  private refreshMySessionSystems(): void {
    this.gmSessionsFacade
      .getMySessionSystems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (systems) => {
          this.mySessionSystems.set(systems);
          this.ensureSelectedSystemStillExists();
        },
        error: (error) => {
          console.error('[GM SESSION SYSTEMS LOAD ERROR]', error);
        },
      });
  }

  private ensureSelectedSystemStillExists(): void {
    const selectedSystemId = this.selectedSystemId();

    if (!selectedSystemId) {
      return;
    }

    const exists = this.mySessionSystems().some(
      (system) => system.id === selectedSystemId,
    );

    if (!exists) {
      this.systemFilterControl.setValue(null, { emitEvent: false });
    }
  }

  private scrollToForm(): void {
    scrollElementIntoViewWhenReady(
      () => this.formAnchor()?.nativeElement,
      {
        behavior: 'smooth',
        block: 'start',
      },
    );
  }
}
