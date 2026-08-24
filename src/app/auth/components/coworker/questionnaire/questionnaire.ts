import { Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Subscription,
  tap,
} from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';

import {
  ICoworkerQuestionnaireCurrentDeclaration,
  ICoworkerQuestionnaireGetResponse,
  ICoworkerQuestionnairePayload,
  ICoworkerQuestionnaireSaveRequest,
  ICoworkerQuestionnaireSaveResponse,
  ICoworkerQuestionnaireSensitiveMetadata,
  ICoworkerQuestionnaireStatement,
} from '../../../../core/interfaces/i-coworker-questionnaire';
import { CoworkerQuestionnaire as CoworkerQuestionnaireApi } from '../../../../core/services/coworker-questionnaire/coworker-questionnaire';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { CoworkerQuestionnaireForm } from '../../../../core/types/coworker-questionnaire-form';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { QuestionnaireAddresses } from './questionnaire-addresses/questionnaire-addresses';
import { createQuestionnaireCompletionError } from './questionnaire-completion-error';
import {
  getQuestionnaireErrorDescription,
  getQuestionnaireErrorTitle,
  isQuestionnaireStatementChanged,
  normalizeQuestionnaireError,
} from './questionnaire-error';
import { QuestionnaireFieldErrors } from './questionnaire-field-errors';
import {
  applyQuestionnaireFieldErrors,
  clearQuestionnaireFieldErrors,
  focusFirstQuestionnaireField,
} from './questionnaire-form-errors';
import { bindQuestionnaireDependencies } from './questionnaire-dependencies';
import { createCoworkerQuestionnaireForm } from './questionnaire-form';
import { QuestionnaireInstitutions } from './questionnaire-institutions/questionnaire-institutions';
import { QuestionnaireInsurance } from './questionnaire-insurance/questionnaire-insurance';
import { COWORKER_QUESTIONNAIRE_SCOPE, createQuestionnaireI18n } from './questionnaire.i18n';
import { QuestionnairePayment } from './questionnaire-payment/questionnaire-payment';
import { QuestionnairePersonal } from './questionnaire-personal/questionnaire-personal';
import { buildCoworkerQuestionnairePayload } from './questionnaire-request';

const QUESTIONNAIRE_AUTOSAVE_DEBOUNCE_MS = 1_000;

type QuestionnaireSaveSnapshot = Pick<
  ICoworkerQuestionnaireSaveRequest,
  'data' | 'complete' | 'finalDeclaration'
>;

interface QuestionnaireSaveIntent {
  snapshot: QuestionnaireSaveSnapshot;
  localVersion: number;
  notify: boolean;
}

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CheckboxModule,
    MessageModule,
    LoadingOverlay,
    QuestionnaireAddresses,
    QuestionnaireFieldErrors,
    QuestionnaireInstitutions,
    QuestionnaireInsurance,
    QuestionnairePayment,
    QuestionnairePersonal,
  ],
  templateUrl: './questionnaire.html',
  providers: [provideTranslocoScope(COWORKER_QUESTIONNAIRE_SCOPE, 'common')],
})
export class Questionnaire {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly questionnaire = inject(CoworkerQuestionnaireApi);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private formBinding: Subscription | null = null;
  private inFlightSave: QuestionnaireSaveIntent | null = null;
  private pendingSave: QuestionnaireSaveIntent | null = null;
  private latestLocalSnapshot: ICoworkerQuestionnairePayload | null = null;
  private savedSnapshot: ICoworkerQuestionnairePayload | null = null;
  private localVersion = 0;

  protected readonly i18n = createQuestionnaireI18n();
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly form = signal<CoworkerQuestionnaireForm | null>(null);
  protected readonly revision = signal<number | null>(null);
  protected readonly statement =
    signal<ICoworkerQuestionnaireStatement | null>(null);
  protected readonly currentDeclaration =
    signal<ICoworkerQuestionnaireCurrentDeclaration | null>(null);
  protected readonly sensitive =
    signal<ICoworkerQuestionnaireSensitiveMetadata>({
      pesel: { configured: false, masked: null },
      identityDocumentNumber: { configured: false, masked: null },
      bankAccount: { configured: false, masked: null },
    });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isCompleting = signal(false);
  protected readonly isComplete = signal(false);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly submitError = signal<EdgeFunctionError | null>(null);
  protected readonly fieldErrors = signal<Readonly<Record<string, string>>>({});

  private readonly appliedFieldPaths = signal<readonly string[]>([]);

  protected readonly activeError = computed(() =>
    this.loadError() ?? this.submitError(),
  );
  protected readonly isSubmitting = computed(
    () => this.isSaving() || this.isCompleting(),
  );
  protected readonly isBusy = computed(
    () => this.isLoading() || this.isSubmitting(),
  );
  protected readonly isUnauthorized = computed(
    () => this.activeError()?.status === 403,
  );
  protected readonly isSessionExpired = computed(
    () => this.activeError()?.status === 401,
  );
  protected readonly isAccessBlocked = computed(
    () => this.isUnauthorized() || this.isSessionExpired(),
  );
  protected readonly requiresReload = computed(
    () =>
      this.submitError()?.code === 'CONCURRENT_MODIFICATION' ||
      isQuestionnaireStatementChanged(this.submitError()),
  );
  protected readonly fieldErrorEntries = computed(() =>
    Object.entries(this.fieldErrors()),
  );
  protected readonly errorTitle = computed(() =>
    getQuestionnaireErrorTitle(
      this.activeError(),
      this.loadError() !== null,
      this.i18n.errors(),
    ),
  );
  protected readonly errorDescription = computed(() =>
    getQuestionnaireErrorDescription(
      this.activeError(),
      this.loadError() !== null,
      this.i18n.errors(),
    ),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.formBinding?.unsubscribe());
    this.load();
  }

  protected load(): void {
    if (this.isLoading() || this.inFlightSave !== null) return;

    const currentForm = this.form();
    if (currentForm !== null) {
      clearQuestionnaireFieldErrors(currentForm, this.appliedFieldPaths());
    }
    this.appliedFieldPaths.set([]);
    this.isLoading.set(true);
    this.loadError.set(null);
    this.fieldErrors.set({});

    this.questionnaire
      .get()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => this.hydrateQuestionnaire(response),
        error: (error: unknown) => {
          this.loadError.set(
            normalizeQuestionnaireError(
              error,
              this.i18n.errors().unexpectedDescription,
            ),
          );
        },
      });
  }

  protected saveDraft(): void {
    this.save(false);
  }

  protected complete(): void {
    this.save(true);
  }

  protected applyFieldErrors(
    fieldErrors: Readonly<Record<string, string>>,
  ): void {
    const form = this.form();
    if (form === null) return;

    const appliedPaths = applyQuestionnaireFieldErrors(form, fieldErrors);
    this.appliedFieldPaths.set(appliedPaths);
    this.fieldErrors.set(fieldErrors);
    focusFirstQuestionnaireField(this.host.nativeElement, appliedPaths);
  }

  private hydrateQuestionnaire(
    response: ICoworkerQuestionnaireGetResponse,
  ): void {
    const form = createCoworkerQuestionnaireForm(
      this.formBuilder,
      response.data,
    );
    const initialSnapshot = buildCoworkerQuestionnairePayload(form);
    const binding = bindQuestionnaireDependencies(form);
    binding.add(
      form.valueChanges
        .pipe(
          map(() => buildCoworkerQuestionnairePayload(form)),
          tap((snapshot) => {
            this.latestLocalSnapshot = snapshot;
            this.localVersion += 1;
          }),
          debounceTime(QUESTIONNAIRE_AUTOSAVE_DEBOUNCE_MS),
          distinctUntilChanged(isSameQuestionnaireData),
        )
        .subscribe((snapshot) => this.queueAutosave(snapshot)),
    );

    this.formBinding?.unsubscribe();
    this.formBinding = binding;
    this.inFlightSave = null;
    this.pendingSave = null;
    this.latestLocalSnapshot = initialSnapshot;
    this.savedSnapshot = initialSnapshot;
    this.localVersion = 0;
    this.form.set(form);
    this.applyEnvelope(response);
    this.submitError.set(null);
    this.appliedFieldPaths.set([]);
    this.updateSubmittingState();
  }

  private save(complete: boolean): void {
    const form = this.form();
    const statement = this.statement();
    if (
      form === null ||
      statement === null ||
      this.isLoading() ||
      this.isSubmitting() ||
      this.requiresReload()
    ) return;

    this.clearSubmitState(form);
    const completionError = complete
      ? createQuestionnaireCompletionError(form, this.i18n.errors())
      : null;
    if (completionError !== null) {
      this.submitError.set(completionError);
      this.applyFieldErrors(completionError.fieldErrors);
      return;
    }

    const data = buildCoworkerQuestionnairePayload(form);
    this.latestLocalSnapshot = data;
    this.enqueueSave({
      snapshot: {
        data,
        complete,
        finalDeclaration: complete
          ? {
              statementKey: statement.statementKey,
              statementVersion: statement.statementVersion,
              accepted: true,
            }
          : null,
      },
      localVersion: this.localVersion,
      notify: true,
    });
  }

  private queueAutosave(data: ICoworkerQuestionnairePayload): void {
    if (
      this.isComplete() ||
      this.isCompleting() ||
      this.requiresReload()
    ) return;

    if (
      this.inFlightSave === null &&
      this.pendingSave === null &&
      this.savedSnapshot !== null &&
      isSameQuestionnaireData(data, this.savedSnapshot)
    ) return;

    this.enqueueSave({
      snapshot: { data, complete: false, finalDeclaration: null },
      localVersion: this.localVersion,
      notify: false,
    });
  }

  private enqueueSave(intent: QuestionnaireSaveIntent): void {
    if (this.inFlightSave !== null) {
      if (isSameSaveSnapshot(intent.snapshot, this.inFlightSave.snapshot)) {
        this.inFlightSave.notify ||= intent.notify;
        this.pendingSave = null;
      } else if (
        this.pendingSave !== null &&
        isSameSaveSnapshot(intent.snapshot, this.pendingSave.snapshot)
      ) {
        this.pendingSave.notify ||= intent.notify;
      } else {
        this.pendingSave = intent;
      }
      this.updateSubmittingState();
      return;
    }

    if (this.isLoading()) {
      this.pendingSave = intent;
      this.updateSubmittingState();
      return;
    }

    this.pendingSave = null;
    this.sendSave(intent);
  }

  private sendSave(intent: QuestionnaireSaveIntent): void {
    this.inFlightSave = intent;
    this.clearSubmitState(this.form());
    this.updateSubmittingState();

    this.questionnaire
      .save({
        ...intent.snapshot,
        expectedRevision: this.revision(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleSaveSuccess(intent, response),
        error: (error: unknown) => this.handleSaveError(intent, error),
      });
  }

  private handleSaveSuccess(
    intent: QuestionnaireSaveIntent,
    response: ICoworkerQuestionnaireSaveResponse,
  ): void {
    if (this.inFlightSave !== intent) return;

    this.inFlightSave = null;
    this.savedSnapshot = intent.snapshot.data;
    this.applyEnvelope(response);

    const form = this.form();
    if (
      form !== null &&
      this.submitError() === null &&
      intent.localVersion === this.localVersion &&
      this.latestLocalSnapshot !== null &&
      isSameQuestionnaireData(
        intent.snapshot.data,
        this.latestLocalSnapshot,
      )
    ) {
      form.markAsPristine();
      if (intent.notify) form.markAsUntouched();
    }

    if (intent.notify) this.showSaveSuccess(response.complete);

    if (intent.snapshot.complete && response.complete) {
      this.pendingSave = null;
      form?.controls.finalDeclarationAccepted.setValue(false, {
        emitEvent: false,
      });
      this.updateSubmittingState();
      void this.router.navigateByUrl(this.router.url, {
        onSameUrlNavigation: 'reload',
        replaceUrl: true,
      });
      return;
    }

    this.flushPendingSave();
  }

  private handleSaveError(
    intent: QuestionnaireSaveIntent,
    error: unknown,
  ): void {
    if (this.inFlightSave !== intent) return;

    this.inFlightSave = null;
    const normalized = normalizeQuestionnaireError(
      error,
      this.i18n.errors().unexpectedDescription,
    );
    this.submitError.set(normalized);

    const fieldErrors = normalized.code === 'PESEL_CONFLICT'
      ? {
          ...normalized.fieldErrors,
          'data.personal.pesel': this.i18n.errors().peselConflictField,
        }
      : normalized.fieldErrors;
    this.applyFieldErrors(fieldErrors);

    if (normalized.code === 'CONCURRENT_MODIFICATION') {
      this.pendingSave = null;
      this.updateSubmittingState();
      return;
    }

    this.flushPendingSave();
  }

  private flushPendingSave(): void {
    const pending = this.pendingSave;
    this.pendingSave = null;
    if (pending === null) {
      this.updateSubmittingState();
      return;
    }

    if (
      !pending.snapshot.complete &&
      this.savedSnapshot !== null &&
      isSameQuestionnaireData(pending.snapshot.data, this.savedSnapshot)
    ) {
      this.updateSubmittingState();
      return;
    }

    this.sendSave(pending);
  }

  private applyEnvelope(
    response:
      | ICoworkerQuestionnaireGetResponse
      | ICoworkerQuestionnaireSaveResponse,
  ): void {
    this.revision.set(response.revision);
    this.statement.set(response.statement);
    this.currentDeclaration.set(response.currentDeclaration);
    this.sensitive.set(response.sensitive);
    this.isComplete.set(response.complete);
  }

  private clearSubmitState(form: CoworkerQuestionnaireForm | null): void {
    if (form !== null) {
      clearQuestionnaireFieldErrors(form, this.appliedFieldPaths());
    }
    this.appliedFieldPaths.set([]);
    this.fieldErrors.set({});
    this.submitError.set(null);
  }

  private updateSubmittingState(): void {
    const intents = [this.inFlightSave, this.pendingSave];
    this.isSaving.set(
      intents.some((intent) =>
        intent !== null && intent.notify && !intent.snapshot.complete
      ),
    );
    this.isCompleting.set(
      intents.some((intent) => intent?.snapshot.complete === true),
    );
  }

  private showSaveSuccess(complete: boolean): void {
    const toast = this.i18n.toast();
    this.toast.success(
      complete
        ? {
            summary: this.i18n.status().completeTitle,
            detail: this.i18n.status().completeDescription,
          }
        : {
            summary: toast.draftSavedSummary,
            detail: toast.draftSavedDetail,
          },
    );
  }

}

function isSameQuestionnaireData(
  left: ICoworkerQuestionnairePayload,
  right: ICoworkerQuestionnairePayload,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isSameSaveSnapshot(
  left: QuestionnaireSaveSnapshot,
  right: QuestionnaireSaveSnapshot,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
