import { Component, computed, DestroyRef, inject, input, output, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';

import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type {
  AdminGlobalEventPageBlocker, AdminGlobalEventPageFieldError, AdminGlobalEventPagePreview,
} from '../../../../core/interfaces/i-admin-global-event-preview';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { presentEventGlobalPreviewError } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftController } from './event-global-draft-controller';

@Component({
  selector: 'app-event-global-diagnostics',
  imports: [ButtonModule, DialogModule, MessageModule],
  templateUrl: './event-global-diagnostics.html',
  host: { class: 'd-contents' },
})
export class EventGlobalDiagnostics {
  readonly coreId = input.required<string>();
  readonly cities = input.required<AdminGlobalCalendarResult['cities']>();
  readonly disabled = input(false);
  readonly navigateToSection = output<AdminGlobalEventPageFieldError>();
  readonly previewChange = output<AdminGlobalEventPagePreview | null>();
  readonly actions = viewChild<TemplateRef<unknown>>('actions');
  private readonly draft = inject(EventGlobalDraftController);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private navigation: AdminGlobalEventPageFieldError | null = null;
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly visible = signal(false);
  protected readonly result = signal<AdminGlobalEventPagePreview | null>(null);
  protected readonly error = signal<unknown | null>(null);
  protected readonly errorFields = computed(() => presentEventGlobalPreviewError(this.error()));
  protected readonly isChecking = this.draft.isChecking;
  protected readonly groups = computed(() => {
    const fields: AdminGlobalEventPageFieldError['field'][] = [
      'coreDraft', 'editionDrafts', 'selectedDate', 'calendarDraft', 'policy', 'cityOverrides',
    ];
    const errors = this.result()?.fieldErrors ?? [];
    return fields.map(field => ({
      field, issues: errors.filter(issue => issue.field === field).map(issue => ({ issue, ...this.issueView(issue) })),
    })).filter(group => group.issues.length);
  });
  protected readonly blockers = computed(() => this.result()?.blockers.map(issue => this.issueView(issue)) ?? []);

  protected check(): void {
    if (this.disabled() || this.isChecking() || this.draft.cityEditing()) return;
    this.result.set(null);
    this.error.set(null);
    this.previewChange.emit(null);
    this.draft.checkErrors(this.coreId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.result.set(result); this.previewChange.emit(result); this.visible.set(true); },
      error: (error: unknown) => {
        this.error.set(error);
        this.visible.set(true);
        this.toast.danger({ summary: this.i18n.diagnostics().failed,
          detail: this.errorFields().find(field => field.key === 'message')?.value });
      },
      complete: () => { if (this.result() === null && this.error() === null) this.visible.set(false); },
    });
    if (this.isChecking()) this.visible.set(true);
  }

  protected close(): void {
    if (!this.isChecking()) this.visible.set(false);
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) this.close();
  }

  protected goToSection(issue: AdminGlobalEventPageFieldError): void {
    if (this.isChecking() || !this.result()?.fieldErrors.some(value => value === issue)) return;
    this.navigation = issue;
    this.close();
  }

  protected onHide(): void {
    this.result.set(null);
    this.error.set(null);
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
