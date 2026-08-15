import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { CommercialPageAdmin } from '../../../../core/services/commercial-page-admin/commercial-page-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { createCommercialPageI18n } from '../../../../core/translations/commercial-pages.i18n';
import type { CommercialPagePublicationIssue } from '../../../../core/types/commercial-page-admin';
import type {
  CommercialPageBuilderDocument,
} from '../../../../core/types/commercial-page-builder';
import { parseIsoDate, toIsoDate } from '../../../../core/utils/date';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-page-publication',
  imports: [ReactiveFormsModule, TranslocoPipe, ButtonModule, DatePickerModule],
  templateUrl: './commercial-page-publication.html',
})
export class CommercialPagePublication {
  private readonly pages = inject(CommercialPageAdmin);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageId = input.required<string>();
  readonly locale = input.required<string>();
  readonly effectiveFrom = input<string | null>(null);
  readonly autoValidate = input(false);

  readonly busyChange = output<boolean>();
  readonly published = output<CommercialPageBuilderDocument>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly commercialI18n = createCommercialPageI18n();
  protected readonly effectiveFromControl = new FormControl<Date | null>(null, {
    validators: [Validators.required],
  });
  protected readonly issues = signal<CommercialPagePublicationIssue[]>([]);
  protected readonly hasValidated = signal(false);
  protected readonly isValidating = signal(false);
  protected readonly isPublishing = signal(false);
  protected readonly isBusy = computed(
    () => this.isValidating() || this.isPublishing(),
  );

  private readonly effectiveFromValue = toSignal(
    this.effectiveFromControl.valueChanges,
    { initialValue: this.effectiveFromControl.value },
  );

  protected readonly canPublish = computed(
    () =>
      this.hasValidated() &&
      !this.issues().length &&
      !!this.effectiveFromValue() &&
      !this.isBusy(),
  );

  private readonly emitBusyChange = effect(() => {
    this.busyChange.emit(this.isBusy());
  });

  constructor() {
    effect(() => {
      const pageId = this.pageId();
      const locale = this.locale();
      const effectiveFrom = this.effectiveFrom();
      const autoValidate = this.autoValidate();

      this.effectiveFromControl.reset(parseIsoDate(effectiveFrom));
      this.resetValidation();

      if (autoValidate && pageId && locale) {
        untracked(() => this.validateDraft(false));
      }
    });
  }

  protected validateDraft(announce = true): void {
    if (this.isBusy()) return;

    this.isValidating.set(true);

    this.validateCurrentDraft()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isValidating.set(false)),
      )
      .subscribe({
        next: (issues) => {
          this.applyValidation(issues);
          if (announce) this.showValidationToast(issues);
        },
        error: () => this.showValidationError(),
      });
  }

  protected publishPage(): void {
    this.effectiveFromControl.markAsTouched();

    const effectiveFrom = this.effectiveFromValue();
    if (!this.canPublish() || !effectiveFrom) return;

    this.isPublishing.set(true);

    this.validateCurrentDraft()
      .pipe(
        switchMap((issues) => {
          this.applyValidation(issues);

          if (issues.length) {
            this.showValidationToast(issues);
            return EMPTY;
          }

          return this.pages.publish(
            this.pageId(),
            toIsoDate(effectiveFrom),
            this.locale(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isPublishing.set(false)),
      )
      .subscribe({
        next: (result) => {
          if (!result.published) {
            this.resetValidation();
            if (result.issues.length) {
              this.applyValidation(result.issues);
            }
            this.showPublishError();
            return;
          }

          const toast = this.i18n.publicationToast();

          this.toast.success({
            summary: toast.publishSuccessSummary,
            detail: toast.publishSuccessDetail,
          });
          this.published.emit(result.document);
        },
        error: () => this.showPublishError(),
      });
  }

  private validateCurrentDraft() {
    this.resetValidation();
    return this.pages.validateDraft(this.pageId(), this.locale());
  }

  private resetValidation(): void {
    this.issues.set([]);
    this.hasValidated.set(false);
  }

  private applyValidation(issues: CommercialPagePublicationIssue[]): void {
    this.issues.set(issues);
    this.hasValidated.set(true);
  }

  private showValidationToast(
    issues: CommercialPagePublicationIssue[],
  ): void {
    const toast = this.i18n.publicationToast();

    if (issues.length) {
      this.toast.danger({
        summary: toast.validationBlockedSummary,
        detail: toast.validationBlockedDetail,
      });
      return;
    }

    this.toast.success({
      summary: toast.validationReadySummary,
      detail: toast.validationReadyDetail,
    });
  }

  private showValidationError(): void {
    const toast = this.i18n.publicationToast();

    this.toast.danger({
      summary: toast.validationFailedSummary,
      detail: toast.validationFailedDetail,
    });
  }

  private showPublishError(): void {
    const toast = this.i18n.publicationToast();

    this.toast.danger({
      summary: toast.publishFailedSummary,
      detail: toast.publishFailedDetail,
    });
  }
}
