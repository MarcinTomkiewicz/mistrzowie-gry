import { Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { finalize, Subscription } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';

import {
  ICoworkerQuestionnaireCurrentDeclaration,
  ICoworkerQuestionnaireSensitiveMetadata,
  ICoworkerQuestionnaireStatement,
} from '../../../../core/interfaces/i-coworker-questionnaire';
import { CoworkerQuestionnaire as CoworkerQuestionnaireApi } from '../../../../core/services/coworker-questionnaire/coworker-questionnaire';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { CoworkerQuestionnaireForm } from '../../../../core/types/coworker-questionnaire-form';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
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
import { buildCoworkerQuestionnaireSaveRequest } from './questionnaire-request';

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
    if (this.isLoading()) return;

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
        next: (response) => {
          const form = createCoworkerQuestionnaireForm(
            this.formBuilder,
            response.data,
          );
          this.formBinding?.unsubscribe();
          this.formBinding = bindQuestionnaireDependencies(form);
          this.form.set(form);
          this.revision.set(response.revision);
          this.statement.set(response.statement);
          this.currentDeclaration.set(response.currentDeclaration);
          this.sensitive.set(response.sensitive);
          this.isComplete.set(response.complete);
          this.submitError.set(null);
          this.appliedFieldPaths.set([]);
        },
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

  private save(complete: boolean): void {
    const form = this.form();
    const statement = this.statement();
    if (
      form === null ||
      statement === null ||
      this.isBusy() ||
      this.requiresReload()
    ) return;

    clearQuestionnaireFieldErrors(form, this.appliedFieldPaths());
    this.appliedFieldPaths.set([]);
    this.fieldErrors.set({});
    this.submitError.set(null);

    const completionError = complete
      ? createQuestionnaireCompletionError(form, this.i18n.errors())
      : null;
    if (completionError !== null) {
      this.submitError.set(completionError);
      this.applyFieldErrors(completionError.fieldErrors);
      return;
    }

    const savingState = complete ? this.isCompleting : this.isSaving;
    savingState.set(true);

    this.questionnaire
      .save(
        buildCoworkerQuestionnaireSaveRequest(
          form,
          this.revision(),
          complete,
          statement,
        ),
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => savingState.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.revision.set(response.revision);
          this.statement.set(response.statement);
          this.currentDeclaration.set(response.currentDeclaration);
          this.sensitive.set(response.sensitive);
          this.isComplete.set(response.complete);
          form.controls.finalDeclarationAccepted.setValue(false);
          form.markAsPristine();
          form.markAsUntouched();

          const toast = this.i18n.toast();
          this.toast.success(
            response.complete
              ? {
                  summary: toast.completeSummary,
                  detail: toast.completeDetail,
                }
              : {
                  summary: toast.draftSavedSummary,
                  detail: toast.draftSavedDetail,
                },
          );

          if (complete && response.complete) {
            void this.router.navigateByUrl(this.router.url, {
              onSameUrlNavigation: 'reload',
              replaceUrl: true,
            });
          }
        },
        error: (error: unknown) => {
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
        },
      });
  }

}
