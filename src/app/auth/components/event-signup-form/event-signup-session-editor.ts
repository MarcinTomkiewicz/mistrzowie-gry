import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { Select, SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import {
  EventSignupFormGroup,
  EventSignupMode,
  IEventSignupModeOption,
} from '../../../core/interfaces/i-event-signup';
import {
  ISessionFormSubmitData,
  ISessionListLabels,
} from '../../../core/interfaces/i-session';
import {
  SESSION_DIFFICULTY_LEVEL_OPTIONS,
  SessionDifficultyLevel,
} from '../../../core/types/sessions';
import {
  ISessionListAction,
  SessionList,
} from '../../../public/common/session-list/session-list';
import { SessionForm } from '../../common/session-form/session-form';
import { EventSignupFormFacade } from './event-signup-form.facade';
import { createEventSignupFormI18n } from './event-signup-form.i18n';

@Component({
  selector: 'app-event-signup-session-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    IftaLabelModule,
    SelectModule,
    TabsModule,
    SessionList,
    SessionForm,
  ],
  templateUrl: './event-signup-session-editor.html',
})
export class EventSignupSessionEditor {
  private readonly facade = inject(EventSignupFormFacade);
  private readonly confirmation = inject(ConfirmationService);

  readonly i18n =
    input.required<ReturnType<typeof createEventSignupFormI18n>>();
  readonly resolveDifficultyLabelFn = (value: SessionDifficultyLevel) =>
    this.resolveDifficultyLabel(value);

  readonly form: EventSignupFormGroup = new FormGroup({
    mode: new FormControl<EventSignupMode>('template', { nonNullable: true }),
    customSessionId: new FormControl<string | null>(null),
  });

  readonly selectedTemplateIdControl = new FormControl<string | null>(null);
  readonly isEditingSubmittedCustomSession = signal(false);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly isBusy = this.facade.isBusy;
  readonly page = this.facade.page;
  readonly resources = this.facade.resources;

  readonly mode = toSignal(
    this.form.controls.mode.valueChanges.pipe(
      startWith(this.form.controls.mode.getRawValue()),
    ),
    { requireSync: true },
  );

  readonly selectedTemplateId = toSignal(
    this.selectedTemplateIdControl.valueChanges.pipe(
      startWith(this.selectedTemplateIdControl.getRawValue()),
    ),
    { requireSync: true },
  );

  readonly selectedCustomSessionId = toSignal(
    this.form.controls.customSessionId.valueChanges.pipe(
      startWith(this.form.controls.customSessionId.getRawValue()),
    ),
    { requireSync: true },
  );

  readonly modeOptions = computed<IEventSignupModeOption[]>(() => [
    {
      value: 'template',
      label: this.i18n().mode().templateLabel,
    },
    {
      value: 'custom',
      label: this.i18n().mode().customLabel,
    },
  ]);

  readonly isTemplateMode = computed(() => this.mode() === 'template');
  readonly isCustomMode = computed(() => this.mode() === 'custom');

  readonly templateSessions = computed(() => this.resources().templateSessions);
  readonly customSessions = computed(() => this.resources().customSessions);

  readonly selectedCustomSession = computed(() => {
    const sessionId = this.selectedCustomSessionId();

    if (!sessionId || !this.isCustomMode()) {
      return null;
    }

    return (
      this.customSessions().find((session) => session.id === sessionId) ?? null
    );
  });

  readonly submittedSessions = computed(() => {
    const session = this.page().submittedSession;

    return session ? [session] : [];
  });
  readonly hasSubmittedCustomSession = computed(() => {
    const page = this.page();

    return (
      !!page.submittedSession &&
      page.mySignup?.customSessionId === page.submittedSession.id
    );
  });
  readonly showSubmittedSessionSummary = computed(
    () =>
      !!this.page().submittedSession &&
      !this.isEditingSubmittedCustomSession(),
  );
  readonly customSessionFormInitial = computed(() => {
    if (this.isEditingSubmittedCustomSession()) {
      return this.page().submittedSession;
    }

    return this.selectedCustomSession();
  });

  readonly customSessionOptions = computed(() =>
    this.customSessions().map((session) => ({
      value: session.id,
      label: `${session.title} - ${session.system?.name ?? '-'}`,
    })),
  );

  readonly difficultyLabels = computed<Record<SessionDifficultyLevel, string>>(
    () => {
      const difficulty = this.i18n().difficulty();

      return Object.fromEntries(
        SESSION_DIFFICULTY_LEVEL_OPTIONS.map((option) => [
          option.value,
          difficulty[option.i18nKey],
        ]),
      ) as Record<SessionDifficultyLevel, string>;
    },
  );

  readonly sessionListLabels = computed<ISessionListLabels>(() => {
    const i18n = this.i18n();

    return {
      systemLabel: i18n.sessionForm().systemLabel,
      titleLabel: i18n.sessionForm().titleLabel,
      difficultyLabel: i18n.sessionForm().difficultyLabel,
      playersLabel: i18n.list().playersHeaderLabel,
      minAgeLabel: i18n.list().minAgeHeaderLabel,
      editLabel: i18n.commonActions().edit,
      deleteLabel: i18n.commonActions().delete,
    };
  });

  readonly canSubmitTemplate = computed(() => {
    const page = this.page();

    return (
      !!page.edition &&
      !!page.occurrence &&
      page.accessState === 'allowed' &&
      !!this.selectedTemplateId()
    );
  });

  readonly submittedSessionActions = computed<
    readonly ISessionListAction[]
  >(() => {
    const actions: ISessionListAction[] = [
      {
        type: 'action',
        label: this.i18n().commonActions().cancel,
        severity: 'danger',
        outlined: true,
      },
    ];

    if (this.hasSubmittedCustomSession()) {
      actions.push({ type: 'edit' });
    }

    return actions;
  });

  constructor() {
    effect(() => {
      this.page();
      this.syncFormWithSignup();
    });
  }

  setMode(mode: EventSignupMode): void {
    this.form.controls.mode.setValue(mode);

    if (mode === 'template') {
      this.form.controls.customSessionId.setValue(null);
      return;
    }

    this.selectedTemplateIdControl.setValue(null);
  }

  onTemplateSelect(sessionId: string): void {
    this.selectedTemplateIdControl.setValue(sessionId);
  }

  onSubmitTemplate(): void {
    const page = this.page();
    const templateSessionId = this.selectedTemplateId();

    if (!page.edition || !page.occurrence || !templateSessionId) {
      return;
    }

    this.facade.saveSignup({
      mode: 'template',
      signupId: page.mySignup?.id ?? null,
      selection: {
        eventId: page.edition.id,
        occurrenceId: page.occurrence.id,
      },
      templateSessionId,
    });
  }

  onSubmitCustom(payload: ISessionFormSubmitData): void {
    const page = this.page();

    if (!page.edition || !page.occurrence) {
      return;
    }

    this.facade.saveSignup({
      mode: 'custom',
      signupId: page.mySignup?.id ?? null,
      selection: {
        eventId: page.edition.id,
        occurrenceId: page.occurrence.id,
      },
      customSourceSessionId: this.form.controls.customSessionId.getRawValue(),
      customSessionPayload: payload,
    });
  }

  onWithdrawCurrentSession(_sessionId: string): void {
    const signupId = this.page().mySignup?.id;

    if (!signupId || this.isBusy()) {
      return;
    }

    const i18n = this.i18n();

    this.confirmation.confirm({
      key: 'event-signup-withdraw',
      header: i18n.commonQuestions().sure,
      message: i18n.confirmation().withdrawMessage,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      rejectVisible: true,
      acceptLabel: i18n.commonActions().yes,
      rejectLabel: i18n.commonActions().no,
      accept: () => {
        this.facade.withdraw(signupId);
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

  onResetCustomSession(): void {
    if (this.isEditingSubmittedCustomSession()) {
      this.isEditingSubmittedCustomSession.set(false);
      this.syncFormWithSignup();
      return;
    }

    this.form.controls.customSessionId.setValue(null);
  }

  onCustomSessionOptionChange(select: Select): void {
    queueMicrotask(() => select.hide(true));
  }

  onEditSubmittedCustomSession(): void {
    const page = this.page();
    const customSessionId = page.mySignup?.customSessionId;

    if (!customSessionId || page.submittedSession?.id !== customSessionId) {
      return;
    }

    this.form.controls.mode.setValue('custom');
    this.selectedTemplateIdControl.setValue(null);
    this.form.controls.customSessionId.setValue(customSessionId);
    this.isEditingSubmittedCustomSession.set(true);
  }

  resolveDifficultyLabel(value: SessionDifficultyLevel): string {
    return this.difficultyLabels()[value] ?? '\u2014';
  }

  private syncFormWithSignup(): void {
    const signup = this.page().mySignup;
    const mode: EventSignupMode = signup?.customSessionId
      ? 'custom'
      : 'template';

    this.isEditingSubmittedCustomSession.set(false);
    this.form.reset(
      {
        mode,
        customSessionId: signup?.customSessionId ?? null,
      },
      { emitEvent: false },
    );
    this.selectedTemplateIdControl.reset(signup?.gmSessionTemplateId ?? null, {
      emitEvent: false,
    });
  }
}
