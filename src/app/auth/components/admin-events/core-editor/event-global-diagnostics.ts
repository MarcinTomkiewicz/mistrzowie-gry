import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';

import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type {
  AdminGlobalEventPageBlocker, AdminGlobalEventPageFieldError, AdminGlobalEventPagePreview,
} from '../../../../core/interfaces/i-admin-global-event-preview';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftController } from './event-global-draft-controller';

@Component({
  selector: 'app-event-global-diagnostics',
  imports: [ButtonModule, DialogModule, MessageModule],
  templateUrl: './event-global-diagnostics.html',
})
export class EventGlobalDiagnostics {
  readonly coreId = input.required<string>();
  readonly cities = input.required<AdminGlobalCalendarResult['cities']>();
  readonly disabled = input(false);
  readonly navigateToSection = output<AdminGlobalEventPageFieldError['field']>();
  private readonly draft = inject(EventGlobalDraftController);
  private readonly destroyRef = inject(DestroyRef);
  private navigation: AdminGlobalEventPageFieldError['field'] | null = null;
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly visible = signal(false);
  protected readonly result = signal<AdminGlobalEventPagePreview | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isChecking = this.draft.isChecking;
  protected readonly groups = computed(() => {
    const fields: AdminGlobalEventPageFieldError['field'][] = [
      'coreDraft', 'editionDrafts', 'selectedDate', 'calendarDraft', 'policy', 'cityOverrides',
    ];
    const errors = this.result()?.fieldErrors ?? [];
    return fields.map(field => ({
      field, issues: errors.filter(issue => issue.field === field).map(issue => this.issueView(issue)),
    })).filter(group => group.issues.length);
  });
  protected readonly blockers = computed(() => this.result()?.blockers.map(issue => this.issueView(issue)) ?? []);

  protected check(): void {
    if (this.disabled() || this.isChecking() || this.draft.cityEditing()) return;
    this.result.set(null);
    this.errorMessage.set(null);
    this.visible.set(true);
    this.draft.checkErrors(this.coreId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => this.result.set(result),
      error: (error: unknown) => this.errorMessage.set(resolveEventEditionAdminErrorMessage(
        error, this.i18n.editionRpcErrors(), this.i18n.commonErrors().concurrentModification,
      )),
    });
  }

  protected close(): void {
    if (!this.isChecking()) this.visible.set(false);
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) this.close();
  }

  protected goToSection(field: AdminGlobalEventPageFieldError['field']): void {
    this.navigation = field;
    this.close();
  }

  protected onHide(): void {
    this.result.set(null);
    this.errorMessage.set(null);
    if (this.navigation) this.navigateToSection.emit(this.navigation);
    this.navigation = null;
  }

  private issueView(issue: AdminGlobalEventPageFieldError | AdminGlobalEventPageBlocker) {
    return {
      message: this.i18n.diagnostics().messages[issue.code],
      detail: 'detail' in issue ? issue.detail : null,
      city: 'editionId' in issue
        ? this.cities().find(city => city.editionId === issue.editionId)?.city ?? issue.editionId : null,
    };
  }
}
