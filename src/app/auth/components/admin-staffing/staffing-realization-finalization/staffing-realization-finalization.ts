import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { STAFFING_READINESS_SECTIONS, STAFFING_READINESS_TAB_PATHS } from '../../../../core/configs/staffing-readiness.config';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { createStaffingSaveLabel } from '../../../../core/translations/staffing.i18n';
import { StaffingRealizationReadinessSection } from '../../../../core/types/staffing-realization-readiness';
import { createStaffingRealizationFinalizationI18n } from './staffing-realization-finalization.i18n';

@Component({
  selector: 'app-staffing-realization-finalization',
  imports: [ButtonModule, MessageModule, RouterLink],
  templateUrl: './staffing-realization-finalization.html',
})
export class StaffingRealizationFinalization {
  private readonly destroyRef = inject(DestroyRef);
  private readonly editor = inject(StaffingRealizationEditorFacade);
  private readonly toast = inject(UiToast);

  readonly isSaving = input.required<boolean>();
  readonly saveDisabled = input.required<boolean>();
  readonly saveDraft = output<void>();
  readonly cancel = output<void>();
  readonly busyChange = output<boolean>();

  protected readonly i18n = createStaffingRealizationFinalizationI18n();
  protected readonly store = this.editor.store;
  protected readonly saveLabel = createStaffingSaveLabel(
    () => this.store.realization()?.status,
    () => this.i18n.commonActions().save,
  );
  protected readonly tabPaths = STAFFING_READINESS_TAB_PATHS;
  protected readonly operation = signal<'validate' | 'open' | null>(null);
  protected readonly busy = computed(() => this.isSaving() || this.operation() !== null);
  protected readonly isDraft = computed(() => this.store.realization()?.status === 'draft');
  protected readonly canOpen = computed(() => this.isDraft() &&
    !this.store.hasUnsavedChanges() && this.store.readiness()?.ready === true);
  protected readonly groups = computed(() => STAFFING_READINESS_SECTIONS.map((section) => ({
    section,
    issues: this.store.readiness()?.issues.filter((issue) => issue.section === section) ?? [],
  })).filter((group) => group.issues.length));
  protected readonly sectionLabels = computed<Record<StaffingRealizationReadinessSection, string>>(() => {
    const tabs = this.i18n.tabs();
    return { core: tabs.core, schedule: tabs.schedule,
      travel_terms: tabs.travelTerms, recruitment_policy: tabs.recruitmentPolicy };
  });

  constructor() {
    effect(() => this.busyChange.emit(this.operation() !== null));
  }

  protected validate(): void {
    const realizationId = this.store.realizationId();
    if (!realizationId || !this.isDraft() || this.busy() || this.store.hasUnsavedChanges()) return;
    this.operation.set('validate');
    this.editor.validate(realizationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.operation.set(null)),
    ).subscribe({
      error: () => this.toast.danger({ summary: this.i18n.copy().validateFailed,
        detail: this.i18n.commonErrors().generic }),
    });
  }

  protected open(): void {
    const realizationId = this.store.realizationId();
    if (!realizationId || this.busy() || !this.canOpen()) return;
    this.operation.set('open');
    this.editor.open(realizationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.operation.set(null)),
    ).subscribe({
      next: (result) => {
        if (result.opened && this.store.realizationId() === realizationId) {
          this.toast.success({ summary: this.i18n.commonStatus().success,
            detail: this.i18n.copy().openSuccess });
        }
      },
      error: () => this.toast.danger({ summary: this.i18n.copy().openFailed,
        detail: this.i18n.copy().openFailedDetail }),
    });
  }
}
