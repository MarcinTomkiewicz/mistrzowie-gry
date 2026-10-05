import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { finalize, Observable, Subscription } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../core/configs/badge-class.config';
import { GmStaffingRealizationFacade } from '../../../core/facades/staffing/gm-staffing-realization-facade';
import type { ISelectOption } from '../../../core/interfaces/i-select-option';
import type { MyStaffingCandidate } from '../../../core/interfaces/my-staffing-realization';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { formatDateLabel, formatTimestampLabel } from '../../../core/utils/date';
import { createGmStaffingRealizationDetailI18n } from './gm-staffing-realization-detail.i18n';

@Component({
  selector: 'app-gm-staffing-participation',
  imports: [ReactiveFormsModule, ButtonModule, MultiSelectModule, SelectModule],
  templateUrl: './gm-staffing-participation.html',
})
export class GmStaffingParticipation {
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private replacementLoaded = false;
  private replacementSubscription: Subscription | null = null;

  protected readonly facade = inject(GmStaffingRealizationFacade);
  protected readonly detail = this.facade.detail;
  protected readonly actions = this.facade.actions;
  protected readonly i18n = createGmStaffingRealizationDetailI18n();
  protected readonly statusBadgeClass = STATUS_BADGE_CLASS;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly dayIds = new FormControl<string[]>([], { nonNullable: true, validators: [Validators.required] });
  protected readonly replacementId = new FormControl<string | null>(null);
  protected readonly showWithdrawal = signal(false);
  protected readonly replacementOptions = signal<ISelectOption<string>[]>([]);
  protected readonly replacementLoading = signal(false);
  protected readonly replacementLoadFailed = signal(false);
  protected readonly dayOptions = computed(() => this.detail()?.days.map(day => ({
    value: day.id, label: formatDateLabel(day.date, 'pl-PL', true),
  })) ?? []);
  protected readonly candidateDays = computed(() => {
    const detail = this.detail();
    const scope = detail?.candidate?.scope;
    return detail && scope?.mode === 'selected_days'
      ? detail.days.filter(day => scope.dayIds.includes(day.id)) : [];
  });
  protected readonly candidateTimestampFields = [
    'submittedAt', 'withdrawnAt', 'gmDecidedAt', 'adminDecidedAt',
  ] as const;

  constructor() {
    const realizationId = computed(() => this.detail()?.id);
    effect(() => {
      realizationId();
      untracked(() => {
        this.replacementSubscription?.unsubscribe();
        this.replacementSubscription = null;
        this.dayIds.reset();
        this.cancelWithdrawal();
        this.replacementOptions.set([]);
        this.replacementLoaded = false;
        this.replacementLoading.set(false);
        this.replacementLoadFailed.set(false);
      });
    });
  }

  protected createApplication(): void {
    const detail = this.detail();
    if (!detail || !this.actions()?.canCreate || this.facade.isMutating()) return;
    if (this.actions()?.selectedDays && this.dayIds.invalid) {
      this.dayIds.markAsTouched();
      return;
    }
    this.run(this.facade.createSelfApplication(detail.id, this.actions()?.selectedDays ? this.dayIds.value : null),
      this.i18n.copy().application.createSuccess);
  }

  protected submitApplication(): void {
    const candidate = this.detail()?.candidate;
    if (!candidate || !this.actions()?.canSubmit || this.facade.isMutating()) return;
    this.run(this.facade.submitSelfApplication(candidate.id), this.i18n.copy().application.submitSuccess);
  }

  protected confirmApplicationWithdrawal(event: Event): void {
    const candidate = this.detail()?.candidate;
    if (!candidate || !this.actions()?.canWithdrawApplication || this.facade.isMutating()) return;
    this.confirm.dangerDecision(event, {
      message: this.i18n.copy().application.withdrawConfirm,
      acceptLabel: this.i18n.copy().application.withdraw,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (this.detail()?.candidate?.id !== candidate.id ||
          !this.actions()?.canWithdrawApplication || this.facade.isMutating()) return;
        this.run(this.facade.withdrawSelfApplication(candidate.id), this.i18n.copy().application.withdrawSuccess);
      },
    });
  }

  protected confirmProposalDecision(event: Event, decision: 'accepted' | 'rejected'): void {
    const candidate = this.detail()?.candidate;
    if (!candidate || !this.actions()?.canDecideProposal || this.facade.isMutating()) return;
    const copy = this.i18n.copy().proposal;
    const options = {
      message: decision === 'accepted' ? copy.acceptConfirm : copy.rejectConfirm,
      acceptLabel: decision === 'accepted' ? copy.accept : copy.reject,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (this.detail()?.candidate?.id !== candidate.id ||
          !this.actions()?.canDecideProposal || this.facade.isMutating()) return;
        this.run(this.facade.decideAdminProposal(candidate.id, decision),
          decision === 'accepted' ? copy.acceptSuccess : copy.rejectSuccess);
      },
    };
    if (decision === 'rejected') this.confirm.dangerDecision(event, options);
    else this.confirm.decision(event, options);
  }

  protected openWithdrawal(): void {
    this.facade.refreshTime();
    if (!this.actions()?.canWithdrawParticipation || this.facade.isMutating()) return;
    this.showWithdrawal.set(true);
    if (!this.replacementLoaded) this.loadReplacements();
  }

  protected cancelWithdrawal(): void {
    this.showWithdrawal.set(false);
    this.replacementId.reset();
  }

  protected loadReplacements(): void {
    const candidate = this.detail()?.candidate;
    if (!candidate || !this.actions()?.canWithdrawParticipation || this.replacementLoading()) return;
    this.replacementLoading.set(true);
    this.replacementLoadFailed.set(false);
    this.replacementSubscription = this.facade.getReplacementGmOptions(candidate.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.replacementLoading.set(false)),
    ).subscribe({
      next: options => {
        this.replacementOptions.set(options);
        this.replacementLoaded = true;
      },
      error: () => this.replacementLoadFailed.set(true),
    });
  }

  protected confirmParticipationWithdrawal(event: Event): void {
    if (!this.validateWithdrawal()) return;
    const candidate = this.detail()?.candidate;
    if (!candidate) return;
    const replacementId = this.replacementId.value;
    const copy = this.i18n.copy().participation;
    this.confirm.dangerDecision(event, {
      message: replacementId === null ? copy.withdrawConfirm : copy.withdrawWithReplacementConfirm,
      acceptLabel: copy.withdraw,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (this.detail()?.candidate?.id !== candidate.id ||
          this.replacementId.value !== replacementId || !this.validateWithdrawal()) return;
        this.run(this.facade.withdrawConfirmedParticipation(candidate.id, replacementId),
          replacementId === null ? this.i18n.copy().participation.withdrawSuccess
            : this.i18n.copy().participation.withdrawWithReplacementSuccess);
      },
    });
  }

  private validateWithdrawal(): boolean {
    this.facade.refreshTime();
    if (!this.actions()?.canWithdrawParticipation || this.facade.isMutating()) return false;
    if (this.actions()?.replacementRequired && this.replacementId.value === null) {
      this.replacementId.markAsTouched();
      return false;
    }
    return true;
  }

  private run(request: Observable<MyStaffingCandidate>, successSummary: string): void {
    const realizationId = this.detail()?.id;
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.detail()?.id !== realizationId) return;
        this.dayIds.reset();
        this.cancelWithdrawal();
        this.toast.success({ summary: successSummary });
      },
      error: () => {
        if (this.detail()?.id !== realizationId) return;
        this.toast.danger({
          summary: this.i18n.copy().errors.actionFailed,
          detail: this.i18n.commonErrors().generic,
        });
      },
    });
  }
}
