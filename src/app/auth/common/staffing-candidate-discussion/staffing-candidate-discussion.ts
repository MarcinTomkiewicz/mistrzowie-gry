import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { finalize, Observable, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import type { MyStaffingCandidate } from '../../../core/interfaces/my-staffing-realization';
import type { StaffingCandidateThread } from '../../../core/interfaces/staffing-candidate-thread';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { formatTimestampLabel } from '../../../core/utils/date';
import { setControlEnabled } from '../../../core/utils/form-controls';
import { normalizeText } from '../../../core/utils/normalize-text';
import { getUserDisplayName } from '../../../core/utils/user-display';
import { requiredTrimmedValidator } from '../../../core/validators/required-trimmed.validator';
import { createStaffingCandidateDiscussionI18n } from './staffing-candidate-discussion.i18n';

@Component({
  selector: 'app-staffing-candidate-discussion',
  imports: [ReactiveFormsModule, ButtonModule, FloatLabelModule, TextareaModule, LoadingOverlay],
  templateUrl: './staffing-candidate-discussion.html',
})
export class StaffingCandidateDiscussion {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private readonly reloadVersion = signal(0);
  private currentCandidateId: string | null = null;
  private sendRequest: Subscription | null = null;

  readonly candidate = input.required<MyStaffingCandidate>();
  readonly timezone = input.required<string>();
  readonly loadThread = input.required<(candidateId: string) => Observable<StaffingCandidateThread>>();
  readonly createMessage = input.required<(candidateId: string, body: string) => Observable<StaffingCandidateThread>>();

  protected readonly i18n = createStaffingCandidateDiscussionI18n();
  protected readonly thread = signal<StaffingCandidateThread | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSending = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly form = new FormGroup({
    body: new FormControl('', { nonNullable: true, validators: [requiredTrimmedValidator()] }),
  });
  protected readonly canWrite = computed(() =>
    this.thread()?.writable === true && !this.isLoading() && !this.isSending(),
  );
  protected readonly getUserDisplayName = getUserDisplayName;
  protected readonly formatTimestampLabel = formatTimestampLabel;

  constructor() {
    effect(() => setControlEnabled(this.form, this.canWrite()));
    effect(onCleanup => {
      const candidateId = this.candidate().id;
      const loadThread = this.loadThread();
      this.reloadVersion();
      if (this.currentCandidateId !== candidateId) {
        this.currentCandidateId = candidateId;
        this.form.reset();
      }
      this.thread.set(null);
      this.isLoading.set(true);
      this.loadFailed.set(false);
      const request = loadThread(candidateId).pipe(
        finalize(() => this.isLoading.set(false)),
      ).subscribe({
        next: thread => this.thread.set(thread),
        error: () => this.loadFailed.set(true),
      });
      onCleanup(() => {
        request.unsubscribe();
        this.sendRequest?.unsubscribe();
      });
    });
  }

  protected refresh(): void {
    if (!this.isLoading() && !this.isSending()) this.reloadVersion.update(version => version + 1);
  }

  protected send(): void {
    if (!this.canWrite()) return;
    const body = normalizeText(this.form.controls.body.value);
    if (this.form.invalid || body === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSending.set(true);
    this.sendRequest = this.createMessage()(this.candidate().id, body).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isSending.set(false)),
    ).subscribe({
      next: thread => {
        this.thread.set(thread);
        this.form.reset();
        this.toast.success({ summary: this.i18n.copy().sendSuccess });
      },
      error: () => this.toast.danger({
        summary: this.i18n.copy().sendFailed,
        detail: this.i18n.commonErrors().generic,
      }),
    });
  }
}
