import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { SessionDetails } from '../../../../common/session-details/session-details';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import { mapStaffingFinalSessionOverrideToInput } from '../../../../core/factories/staffing-final-plan-form.factory';
import type { AdminStaffingFinalPlanAssignment } from '../../../../core/interfaces/admin-staffing-final-plan';
import type { AdminStaffingRealizationBoard } from '../../../../core/interfaces/admin-staffing-realization-board';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import type { SessionDetailsData } from '../../../../core/interfaces/i-session';
import type { StaffingCandidateSessionOptions } from '../../../../core/interfaces/staffing-candidate-session-options';
import type { StaffingCandidateSessionMapping } from '../../../../core/interfaces/staffing-candidate-session-proposals';
import type { SessionSourceKind } from '../../../../core/types/session-source';
import type { StaffingFinalPlanItemDraft, StaffingFinalPlanItemForm } from '../../../../core/types/staffing-final-plan-form';
import { compareByPosition } from '../../../../core/utils/compare-by-position';
import { sessionPlayersRangeValidator } from '../../../../core/validators/session-players-range.validator';
import { createStaffingFinalPlanEditorI18n } from './staffing-final-plan-editor.i18n';
import { StaffingFinalSessionOverrideEditor } from './staffing-final-session-override-editor';

@Component({
  selector: 'app-staffing-final-plan-assignment-editor',
  imports: [ReactiveFormsModule, ButtonModule, SelectModule, LoadingOverlay, SessionDetails, StaffingFinalSessionOverrideEditor],
  templateUrl: './staffing-final-plan-assignment-editor.html',
})
export class StaffingFinalPlanAssignmentEditor {
  private readonly facade = inject(StaffingRealizationEditorFacade);
  private readonly retryVersion = signal(0);
  private readonly draft = signal<StaffingFinalPlanItemDraft | null>(null);

  readonly form = input.required<StaffingFinalPlanItemForm>();
  readonly board = input.required<AdminStaffingRealizationBoard>();
  readonly dayId = input.required<string>();
  readonly gmNames = input.required<ReadonlyMap<string, string>>();
  readonly assignment = input<AdminStaffingFinalPlanAssignment | null>(null);
  readonly editable = input(false);
  readonly remove = output<void>();

  protected readonly i18n = createStaffingFinalPlanEditorI18n();
  protected readonly options = signal<StaffingCandidateSessionOptions | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly showDetails = signal(false);
  protected readonly previewedProposalId = signal<string | null>(null);
  protected readonly showOverride = signal(false);
  protected readonly showOtherSession = signal(false);
  protected readonly controlId = computed(() => {
    const value = this.draft();
    return `staffing-final-${value?.id ?? `${value?.slotId}-${value?.position}`}`;
  });
  protected readonly selectedCandidate = computed(() =>
    this.board().candidates.find(candidate => candidate.id === this.draft()?.candidateId) ?? null,
  );
  protected readonly gmName = computed(() => {
    const userId = this.selectedCandidate()?.gmUserId ?? this.assignment()?.gmUserId;
    return userId ? this.gmNames().get(userId) ?? userId : null;
  });
  protected readonly candidateOptions = computed(() => {
    const options: (ISelectOption<string> & { disabled?: boolean })[] = this.board().candidates
      .filter(candidate => candidate.state === 'confirmed' && candidate.participation.active &&
        (candidate.scope.mode === 'whole_realization' || candidate.scope.dayIds.includes(this.dayId())))
      .map(candidate => ({ value: candidate.id, label: this.gmNames().get(candidate.gmUserId) ?? candidate.gmUserId }));
    const selected = this.selectedCandidate();
    if (selected && !options.some(option => option.value === selected.id)) {
      options.push({ value: selected.id, label: this.gmNames().get(selected.gmUserId) ?? selected.gmUserId, disabled: true });
    }
    return options;
  });
  protected readonly sourceOptions = computed<ISelectOption<SessionSourceKind>[]>(() => [
    { value: 'template', label: this.i18n.sessionSelector().sources.template },
    { value: 'custom', label: this.i18n.sessionSelector().sources.custom },
  ]);
  protected readonly sessionOptions = computed<ISelectOption<string>[]>(() => {
    const source = this.draft()?.sourceKind;
    return source ? (this.options()?.sessions[source] ?? []).map(session => ({
      value: session.id, label: `${session.title} - ${session.system.name}`,
    })) : [];
  });
  protected readonly selectedSession = computed(() => {
    const draft = this.draft();
    return draft ? this.options()?.sessions[draft.sourceKind].find(session => session.id === draft.sessionId) ?? null : null;
  });
  private readonly baseSession = computed<SessionDetailsData | null>(() => {
    const draft = this.draft();
    const assignment = this.assignment();
    const session = this.selectedSession();
    if (!draft) return null;
    if (assignment && draft.candidateId === assignment.candidateId &&
      draft.sourceKind === assignment.sourceKind && draft.sessionId === assignment.sessionId) {
      return assignment.sessionSnapshot;
    }
    return session;
  });
  protected readonly preview = computed<SessionDetailsData | null>(() => {
    this.draft();
    const base = this.baseSession();
    const assignment = this.assignment();
    const session = this.selectedSession();
    if (!base) return null;
    const effective = this.form().pristine && base === assignment?.sessionSnapshot
      ? assignment.effectiveSession
      : { ...base, ...mapStaffingFinalSessionOverrideToInput(this.form().controls.sessionOverride) };
    return { ...effective, system: session?.system.id === effective.systemId ? session.system : undefined };
  });
  protected readonly proposalRows = computed(() => {
    const options = this.options();
    const draft = this.draft();
    if (!options) return [];
    const mappings = options.proposals.slots.find(slot => slot.slotId === draft?.slotId)?.mappings ?? [];
    return [...mappings].sort(compareByPosition).map(mapping => ({
      ...mapping,
      selected: mapping.sourceKind === draft?.sourceKind && mapping.sessionId === draft?.sessionId,
      session: options.sessions[mapping.sourceKind].find(session => session.id === mapping.sessionId) ?? null,
    }));
  });
  protected readonly sessionSummary = computed(() =>
    this.proposalRows().some(proposal => proposal.selected) ? null : this.preview(),
  );

  constructor() {
    effect(onCleanup => {
      const form = this.form();
      this.draft.set(form.getRawValue());
      const subscription = form.valueChanges.subscribe(() => this.draft.set(form.getRawValue()));
      onCleanup(() => subscription.unsubscribe());
    });
    effect(() => {
      const base = this.baseSession();
      const override = this.form().controls.sessionOverride;
      override.setValidators(base ? sessionPlayersRangeValidator(base) : null);
      override.updateValueAndValidity({ emitEvent: false });
    });
    effect(onCleanup => {
      const candidate = this.selectedCandidate();
      this.retryVersion();
      this.options.set(null);
      this.previewedProposalId.set(null);
      this.showOtherSession.set(false);
      this.loadFailed.set(false);
      if (!candidate) return;
      this.isLoading.set(true);
      const request = this.facade.loadFinalPlanCandidate(candidate).pipe(
        finalize(() => this.isLoading.set(false)),
      ).subscribe({
        next: options => this.options.set(options),
        error: () => this.loadFailed.set(true),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  protected selectProposal(proposal: StaffingCandidateSessionMapping): void {
    if (!this.editable()) return;
    const form = this.form();
    form.markAsDirty();
    form.patchValue({ sourceKind: proposal.sourceKind, sessionId: proposal.sessionId });
    this.resetOverride();
    this.showOtherSession.set(false);
  }

  protected resetSession(): void {
    this.form().controls.sessionId.reset();
    this.resetOverride();
  }

  protected resetOverride(): void {
    this.form().controls.sessionOverride.reset();
    this.showDetails.set(false);
    this.showOverride.set(false);
  }

  protected retry(): void {
    this.retryVersion.update(version => version + 1);
  }
}
