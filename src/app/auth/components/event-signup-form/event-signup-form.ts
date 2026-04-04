import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { finalize, forkJoin, Observable, of, startWith, switchMap } from 'rxjs';

import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { Select, SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import {
  EventOccurrenceStatus,
  EventProgramItemSourceKind,
} from '../../../core/enums/event';
import { buildSiteUrl } from '../../../core/config/site';
import {
  IEventSignupLoadData,
  IEventSignupSavePayload,
} from '../../../core/interfaces/i-event-signup';
import { IOccurrenceSwitcherOption } from '../../../core/interfaces/i-occurrence-switcher';
import {
  ISessionListLabels,
  ISessionWithRelations,
  IUpdateSessionPayload,
} from '../../../core/interfaces/i-session';
import { Auth } from '../../../core/services/auth/auth';
import { EventRead } from '../../../core/services/event-read/event-read';
import { EventSignup } from '../../../core/services/event-signup/event-signup';
import { Seo } from '../../../core/services/seo/seo';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  SESSION_DIFFICULTY_LEVEL_OPTIONS,
  SessionDifficultyLevel,
} from '../../../core/types/sessions';
import {
  formatDateLabel,
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
} from '../../../core/utils/date';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { OccurrenceSwitcher } from '../../../public/common/occurrence-switcher/occurrence-switcher';
import {
  ISessionListAction,
  SessionList,
} from '../../../public/common/session-list/session-list';
import { SessionForm } from '../../common/session-form/session-form';
import { createEventSignupFormI18n } from './event-signup-form.i18n';

interface IModeOption {
  value: EventSignupMode;
  label: string;
}

type EventSignupMode = 'template' | 'custom';

type EventSignupFormGroup = FormGroup<{
  mode: FormControl<EventSignupMode>;
  customSessionId: FormControl<string | null>;
}>;

@Component({
  selector: 'app-event-signup-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    ConfirmDialogModule,
    IftaLabelModule,
    SelectModule,
    TabsModule,
    LoadingOverlay,
    OccurrenceSwitcher,
    SessionList,
    SessionForm,
  ],
  templateUrl: './event-signup-form.html',
  styleUrl: './event-signup-form.scss',
  providers: [provideTranslocoScope('auth', 'common', 'sessions')],
})
export class EventSignupFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly eventRead = inject(EventRead);
  private readonly eventSignup = inject(EventSignup);
  private readonly seo = inject(Seo);
  private readonly toast = inject(UiToast);
  private readonly confirmation = inject(ConfirmationService);

  private readonly rangeStartIso = getStartOfCurrentMonthIso();
  private readonly rangeEndIso = getEndOfNextMonthIso();

  readonly i18n = createEventSignupFormI18n();

  readonly form: EventSignupFormGroup = new FormGroup({
    mode: new FormControl<EventSignupMode>('template', { nonNullable: true }),
    customSessionId: new FormControl<string | null>(null),
  });

  readonly selectedTemplateIdControl = new FormControl<string | null>(null);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly isEditingSubmittedCustomSession = signal(false);

  readonly data = signal<IEventSignupLoadData>(
    this.eventRead.createEmptyHostSignupLoadData(),
  );
  readonly occurrenceOptions = signal<IOccurrenceSwitcherOption[]>([]);

  readonly routeParams = toSignal(
    this.route.paramMap.pipe(startWith(this.route.snapshot.paramMap)),
    { requireSync: true },
  );

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

  readonly isBusy = computed(() => this.isLoading() || this.isSubmitting());

  readonly page = computed(() => this.data().page);
  readonly resources = computed(() => this.data().resources);

  readonly modeOptions = computed<IModeOption[]>(() => [
    {
      value: 'template',
      label: this.i18n.mode().templateLabel,
    },
    {
      value: 'custom',
      label: this.i18n.mode().customLabel,
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

  readonly signupSessions = computed<ISessionWithRelations[]>(() => {
    const signup = this.page().mySignup;

    if (!signup) {
      return [];
    }

    if (
      signup.sourceKind === 'gm_session_template' &&
      signup.gmSessionTemplateId
    ) {
      const session = this.templateSessions().find(
        (item) => item.id === signup.gmSessionTemplateId,
      );

      return session ? [session] : [];
    }

    if (signup.sourceKind === 'custom_session' && signup.customSessionId) {
      const session = this.customSessions().find(
        (item) => item.id === signup.customSessionId,
      );

      return session ? [session] : [];
    }

    return [];
  });

  readonly hasSubmittedSession = computed(
    () => this.signupSessions().length > 0,
  );
  readonly hasSubmittedCustomSession = computed(
    () =>
      this.page().mySignup?.sourceKind === EventProgramItemSourceKind.CustomSession,
  );
  readonly showSubmittedSessionSummary = computed(
    () => this.hasSubmittedSession() && !this.isEditingSubmittedCustomSession(),
  );
  readonly customSessionFormInitial = computed(() => {
    if (this.isEditingSubmittedCustomSession()) {
      return this.signupSessions()[0] ?? null;
    }

    return this.selectedCustomSession();
  });

  readonly selectedOccurrenceIndex = computed(() => {
    const occurrenceId = this.page().occurrence?.id;
    const options = this.occurrenceOptions();

    if (!occurrenceId || !options.length) {
      return 0;
    }

    const foundIndex = options.findIndex((item) => item.id === occurrenceId);

    return foundIndex > -1 ? foundIndex : 0;
  });

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const page = this.page();

    if (!page.event || !page.occurrence) {
      return [];
    }

    return [
      {
        label: this.i18n.breadcrumbs().eventSignupLabel,
        routerLink: '/auth/event-signup',
      },
      {
        label: page.event.name,
      },
      {
        label: formatDateLabel(page.occurrence.occurrenceDate, 'pl-PL', true),
      },
    ];
  });

  readonly customSessionOptions = computed(() =>
    this.customSessions().map((session) => ({
      value: session.id,
      label: `${session.title} - ${session.system?.name ?? '-'}`,
    })),
  );

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

  readonly canSubmitTemplate = computed(() => {
    const page = this.page();

    return (
      !!page.event &&
      !!page.occurrence &&
      !!page.canAccess &&
      !!this.selectedTemplateId()
    );
  });
  readonly submittedSessionActions = computed<readonly ISessionListAction[]>(() => {
    const actions: ISessionListAction[] = [
      {
        type: 'action',
        label: this.i18n.actions().withdrawLabel,
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
      this.loadData();
    });

    effect(() => {
      this.syncFormWithSignup();
    });

    effect(() => {
      const params = this.routeParams();
      const eventSlug = params.get('eventSlug');
      const occurrenceDate = params.get('occurrenceDate');
      const pageUrl =
        eventSlug && occurrenceDate
          ? buildSiteUrl(
              `/auth/event-signup/${eventSlug}/${occurrenceDate}/signup`,
            )
          : buildSiteUrl('/auth/event-signup');

      this.seo.apply({
        title: this.i18n.seo().title,
        description: this.i18n.seo().description,
        canonicalUrl: pageUrl,
        robots: 'noindex,nofollow',
      });
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

  onOccurrenceSelect(index: number): void {
    const page = this.page();
    const option = this.occurrenceOptions()[index];

    if (!page.event?.slug || !option?.occurrenceDate) {
      return;
    }

    this.router.navigate([
      '/auth',
      'event-signup',
      page.event.slug,
      option.occurrenceDate,
      'signup',
    ]);
  }

  onSubmitTemplate(): void {
    const page = this.page();
    const templateSessionId = this.selectedTemplateId();

    if (!page.event || !page.occurrence || !templateSessionId) {
      return;
    }

    this.saveSignup({
      mode: 'template',
      signupId: page.mySignup?.id ?? null,
      selection: {
        eventId: page.event.id,
        occurrenceId: page.occurrence.id,
      },
      templateSessionId,
    });
  }

  onSubmitCustom(payload: IUpdateSessionPayload): void {
    const page = this.page();

    if (!page.event || !page.occurrence) {
      return;
    }

    this.saveSignup({
      mode: 'custom',
      signupId: page.mySignup?.id ?? null,
      selection: {
        eventId: page.event.id,
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

    this.confirmation.confirm({
      key: 'event-signup-withdraw',
      header: this.i18n.commonQuestions().sure,
      message: this.i18n.confirmation().withdrawMessage,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      rejectVisible: true,
      acceptLabel: this.i18n.commonActions().yes,
      rejectLabel: this.i18n.commonActions().no,
      accept: () => {
        this.runRequest(this.eventSignup.withdraw(signupId), {
          successSummary: this.i18n.toast().withdrawSuccessSummary,
          successDetail: this.i18n.toast().withdrawSuccessDetail,
          errorSummary: this.i18n.toast().withdrawFailedSummary,
          errorDetail: this.i18n.toast().withdrawFailedDetail,
        });
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
    const signup = this.page().mySignup;

    if (
      signup?.sourceKind !== EventProgramItemSourceKind.CustomSession ||
      !signup.customSessionId
    ) {
      return;
    }

    this.form.controls.mode.setValue('custom');
    this.selectedTemplateIdControl.setValue(null);
    this.form.controls.customSessionId.setValue(signup.customSessionId);
    this.isEditingSubmittedCustomSession.set(true);
  }

  resolveDifficultyLabel(value: SessionDifficultyLevel): string {
    return this.difficultyLabels()[value] ?? '—';
  }

  formatDateLabel = formatDateLabel;

  private saveSignup(payload: IEventSignupSavePayload): void {
    this.runRequest(this.eventSignup.saveSignup(payload), {
      successSummary: this.i18n.toast().saveSuccessSummary,
      successDetail: this.i18n.toast().saveSuccessDetail,
      errorSummary: this.i18n.toast().saveFailedSummary,
      errorDetail: this.i18n.toast().saveFailedDetail,
    });
  }

  private runRequest(
    request$: Observable<unknown>,
    toastConfig: {
      successSummary: string;
      successDetail: string;
      errorSummary: string;
      errorDetail: string;
    },
  ): void {
    this.isSubmitting.set(true);

    request$
      .pipe(
        switchMap(() => this.getScreenData()),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: ({ data, occurrenceOptions }) => {
          this.data.set(data);
          this.occurrenceOptions.set(occurrenceOptions);
          this.isEditingSubmittedCustomSession.set(false);

          this.toast.success({
            summary: toastConfig.successSummary,
            detail: toastConfig.successDetail,
          });
        },
        error: (error) => {
          console.error('[EVENT SIGNUP FORM REQUEST ERROR]', error);

          this.toast.danger({
            summary: toastConfig.errorSummary,
            detail: toastConfig.errorDetail,
          });
        },
      });
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.getScreenData()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ data, occurrenceOptions }) => {
          this.data.set(data);
          this.occurrenceOptions.set(occurrenceOptions);
        },
        error: (error) => {
          console.error('[EVENT SIGNUP FORM LOAD ERROR]', error);

          this.data.set(this.eventRead.createEmptyHostSignupLoadData());
          this.occurrenceOptions.set([]);

          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  private getScreenData(): Observable<{
    data: IEventSignupLoadData;
    occurrenceOptions: IOccurrenceSwitcherOption[];
  }> {
    const params = this.routeParams();
    const eventSlug = params.get('eventSlug');
    const occurrenceDate = params.get('occurrenceDate');
    const userId = this.auth.userId();

    if (!eventSlug || !occurrenceDate) {
      return of({
        data: this.eventRead.createEmptyHostSignupLoadData(),
        occurrenceOptions: [],
      });
    }

    return this.eventRead
      .getHostSignupLoadData(eventSlug, occurrenceDate, userId)
      .pipe(
        switchMap((data) => {
          const eventId = data.page.event?.id;

          if (!eventId) {
            return of({
              data,
              occurrenceOptions: [],
            });
          }

          return forkJoin({
            data: of(data),
            occurrenceOptions: this.eventRead.getOccurrenceOptions(
              eventId,
              this.rangeStartIso,
              this.rangeEndIso,
              [
                EventOccurrenceStatus.HostSignupOpen,
                EventOccurrenceStatus.Published,
              ],
            ),
          });
        }),
      );
  }

  private syncFormWithSignup(): void {
    const signup = this.page().mySignup;

    if (!signup) {
      this.isEditingSubmittedCustomSession.set(false);
      this.form.controls.mode.setValue('template', { emitEvent: false });
      this.form.controls.customSessionId.setValue(null, { emitEvent: false });
      this.selectedTemplateIdControl.setValue(null, { emitEvent: false });
      return;
    }

    if (signup.sourceKind === 'gm_session_template') {
      this.isEditingSubmittedCustomSession.set(false);
      this.form.controls.mode.setValue('template', { emitEvent: false });
      this.form.controls.customSessionId.setValue(null, { emitEvent: false });
      this.selectedTemplateIdControl.setValue(signup.gmSessionTemplateId, {
        emitEvent: false,
      });
      return;
    }

    this.form.controls.mode.setValue('custom', { emitEvent: false });
    this.selectedTemplateIdControl.setValue(null, { emitEvent: false });
    this.form.controls.customSessionId.setValue(signup.customSessionId, {
      emitEvent: false,
    });
  }
}
