import { Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { StepperModule } from 'primeng/stepper';
import { finalize, map, Observable } from 'rxjs';

import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import { scrollElementIntoViewWhenReady } from '../../../../core/utils/scroll';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalDraftFields } from './event-global-draft-fields';
import { EventGlobalDraftReview } from './event-global-draft-review';

const STEP_FIELDS = [
  ['name', 'shortDescription', 'longDescription'],
  ['city', 'venueName', 'venueAddress', 'timezone', 'facebookLink'],
  ['date', 'timeBlocks'],
  ['priceAmount', 'priceCurrency', 'priceBasis', 'isForBeginners', 'participantSignupKind',
    'signupRequired', 'sessionCapacityCeiling', 'wholeEventCapacity'],
] as const;

@Component({
  selector: 'app-event-global-draft-wizard',
  imports: [ReactiveFormsModule, ButtonModule, MessageModule, StepperModule,
    Breadcrumbs, LoadingOverlay, EventGlobalDraftFields, EventGlobalDraftReview],
  templateUrl: './event-global-draft-wizard.html',
  providers: [provideTranslocoScope('adminEvents', 'common'), EventGlobalDraftController],
})
export class EventGlobalDraftWizard {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  protected readonly draft = inject(EventGlobalDraftController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly activeStep = signal(1);
  protected readonly isSaving = signal(false);
  protected readonly steps = computed(() => [
    { value: 1, label: this.i18n.fields().coreSectionTitle },
    { value: 2, label: this.i18n.creationSteps().location },
    { value: 3, label: this.i18n.commonLabels().schedule },
    { value: 4, label: this.i18n.creationSteps().policy },
    { value: 5, label: this.i18n.commonLabels().summary },
  ]);
  protected readonly saveLabel = computed(() => this.draft.state() === 'created' ? this.i18n.creation().retryRead
    : this.draft.state() === 'uncertain' ? this.i18n.creation().retryCreation : this.i18n.commonActions().saveDraft);
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: this.i18n.commonNav().eventsManagement, path: '/admin/content/events' },
    { label: this.i18n.page().createTitle },
  ]);

  constructor() {
    this.destroyRef.onDestroy(this.platform.onWindow('beforeunload', (event) => {
      if (this.draft.state() === 'created' || (!this.isSaving() && !this.draft.form.dirty && this.draft.state() === 'idle')) return;
      event.preventDefault();
      event.returnValue = '';
    }));
  }

  protected goToStep(step: number | undefined): void {
    if (step === undefined || step < 1 || step > 5 || this.isSaving() || this.draft.state() !== 'idle') return;
    if (step > this.activeStep()) {
      for (let current = 1; current < step; current++) {
        if (!this.validateStep(current)) return;
      }
    }
    this.activeStep.set(step);
  }

  protected submit(): void {
    if (this.activeStep() !== 5 || this.isSaving()) return;
    if (this.draft.state() === 'idle') {
      for (let step = 1; step <= 4; step++) {
        if (!this.validateStep(step)) return;
      }
    }
    this.isSaving.set(true);
    this.draft.create().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isSaving.set(false)),
    ).subscribe({
      next: (core) => {
        this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.i18n.toast().saveSuccessDetail });
        void this.router.navigate(['/admin/content/events', core.id, 'edit']);
      },
      error: (error: unknown) => {
        const state = this.draft.state();
        if (state === 'uncertain') {
          this.toast.warn({ summary: this.i18n.creation().uncertain });
        } else {
          this.toast.danger({ summary: this.i18n.toast().saveFailedSummary,
            detail: state === 'created' ? this.i18n.creation().readbackFailed : resolveEventCoreAdminErrorMessage(
              error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification),
          });
        }
      },
    });
  }

  protected cancel(): void {
    void this.router.navigate(['/admin/content/events']);
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.draft.state() === 'created') return true;
    if (this.isSaving() || this.draft.state() === 'uncertain') return false;
    if (this.draft.form.pristine) return true;
    return this.confirm.modalDecision({
      header: this.i18n.page().createTitle,
      message: this.i18n.creation().leaveConfirmation,
      acceptLabel: this.i18n.creation().discardDraft,
      rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(map((accepted) => accepted && !this.destroyRef.destroyed && !this.isSaving() && this.draft.state() === 'idle'));
  }

  private validateStep(step: number): boolean {
    const field = this.findStepError(step);
    if (!field) return true;
    this.activeStep.set(step);
    this.toast.danger({ summary: this.i18n.commonForm().invalidSummary, detail: this.i18n.commonForm().invalid });
    scrollElementIntoViewWhenReady(() => {
      if (this.destroyRef.destroyed || this.activeStep() !== step) return null;
      const [name, index, blockField] = field.split('.');
      const host = this.host.nativeElement;
      const scope = blockField ? host.querySelector<HTMLElement>(`[data-event-block="${index}"]`) : host;
      const control = field === 'timeBlocks' ? host.querySelector<HTMLElement>('#global-event-add-block')
        : Array.from(scope?.querySelectorAll<HTMLElement>('[formControlName]') ?? [])
          .find((element) => element.getAttribute('formControlName') === (blockField ?? name));
      const target = control?.matches('input, textarea, button') ? control
        : control?.querySelector<HTMLElement>('input, button, [tabindex="0"]');
      target?.focus({ preventScroll: true });
      return target;
    }, { block: 'center' });
    return false;
  }

  private findStepError(step: number): string | null {
    const fields = STEP_FIELDS[step - 1];
    if (!fields) return null;
    const form = this.draft.form;
    form.updateValueAndValidity({ emitEvent: false });
    for (const field of fields) form.controls[field].markAllAsTouched();
    for (const field of fields) {
      if (field === 'timeBlocks') {
        for (const [index, block] of form.controls.timeBlocks.controls.entries()) {
          for (const name of ['label', 'startTime', 'endTime', 'requiredGmCount'] as const) {
            if (block.controls[name].invalid) return `timeBlocks.${index}.${name}`;
          }
          if (block.hasError('timeRange')) return `timeBlocks.${index}.endTime`;
        }
      }
      if (form.controls[field].invalid) return field;
      if (field === 'date' && form.hasError('globalDate')) return field;
    }
    return null;
  }
}
