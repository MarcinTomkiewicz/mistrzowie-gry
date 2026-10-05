import { Component, computed, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { finalize, startWith, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { SessionDetails } from '../../../common/session-details/session-details';
import { StaffingSessionSelectorFacade } from '../../../core/facades/staffing/staffing-session-selector-facade';
import type { ISelectOption } from '../../../core/interfaces/i-select-option';
import type { IContentTrigger } from '../../../core/interfaces/i-content-trigger';
import type { IGmStyle } from '../../../core/interfaces/i-gm-style';
import type { ILanguage } from '../../../core/interfaces/i-languages';
import type { ISessionFormSubmitData } from '../../../core/interfaces/i-session';
import type { ISystem } from '../../../core/interfaces/i-system';
import type { StaffingSessionReference } from '../../../core/interfaces/staffing-session-reference';
import { Auth } from '../../../core/services/auth/auth';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { GM_STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import type { SessionSourceKind } from '../../../core/types/session-source';
import { SessionForm } from '../session-form/session-form';
import { createStaffingSessionSelectorI18n } from './staffing-session-selector.i18n';

@Component({
  selector: 'app-staffing-session-selector',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, SelectModule, LoadingOverlay, SessionDetails, SessionForm],
  templateUrl: './staffing-session-selector.html',
  providers: [provideTranslocoScope(GM_STAFFING_SCOPE, 'gmSessions', 'common')],
})
export class StaffingSessionSelector {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private formOptionsRequest: Subscription | null = null;

  readonly selection = input<StaffingSessionReference | null>(null);
  readonly selectionChange = output<StaffingSessionReference | null>();
  readonly busy = input(false);

  protected readonly facade = inject(StaffingSessionSelectorFacade);
  protected readonly i18n = createStaffingSessionSelectorI18n();
  protected readonly gmDisplayName = inject(Auth).displayName;
  protected readonly sourceControl = new FormControl<SessionSourceKind>('template', { nonNullable: true });
  protected readonly sessionControl = new FormControl<string | null>(null);
  protected readonly source = toSignal(this.sourceControl.valueChanges.pipe(
    startWith(this.sourceControl.value),
  ), { requireSync: true });
  protected readonly showDetails = signal(false);
  protected readonly creationSource = signal<SessionSourceKind | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly isFormLoading = signal(false);
  protected readonly formLoadFailed = signal(false);
  protected readonly systems = signal<ISystem[]>([]);
  protected readonly styles = signal<IGmStyle[]>([]);
  protected readonly triggers = signal<IContentTrigger[]>([]);
  protected readonly languages = signal<ILanguage[]>([]);
  protected readonly isBusy = computed(() => this.busy() || this.facade.isLoading() || this.isSubmitting());
  protected readonly sourceOptions = computed<ISelectOption<SessionSourceKind>[]>(() => [
    { value: 'template', label: this.i18n.copy().sources.template },
    { value: 'custom', label: this.i18n.copy().sources.custom },
  ]);
  protected readonly selectedSessionId = computed(() => {
    const selection = this.selection();
    return selection?.sourceKind === this.source() ? selection.sessionId : null;
  });
  protected readonly availableSessions = computed(() => this.facade.sessions()[this.source()]);
  protected readonly sessionOptions = computed<ISelectOption<string>[]>(() =>
    this.availableSessions().map(session => ({
      value: session.id,
      label: `${session.title} - ${session.system.name}`,
    })),
  );
  protected readonly selectedSession = computed(() =>
    this.availableSessions().find(session => session.id === this.selectedSessionId()) ?? null,
  );

  constructor() {
    effect(() => {
      const selection = this.selection();
      untracked(() => {
        if (selection) this.sourceControl.setValue(selection.sourceKind);
        this.sessionControl.setValue(this.selectedSessionId(), { emitEvent: false });
        this.showDetails.set(false);
      });
    });

    this.sourceControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(sourceKind => {
      this.sessionControl.setValue(this.selectedSessionId(), { emitEvent: false });
      this.showDetails.set(false);
      const selection = this.selection();
      if (selection && selection.sourceKind !== sourceKind && !this.isBusy()) this.selectionChange.emit(null);
    });

    this.sessionControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(sessionId => {
      if (sessionId !== null && !this.isBusy()) {
        this.selectionChange.emit({ sourceKind: this.sourceControl.value, sessionId });
      }
    });

    this.facade.load();
  }

  protected openCreation(): void {
    if (this.isBusy() || this.creationSource() !== null) return;
    this.creationSource.set(this.sourceControl.value);
    this.showDetails.set(false);
    this.loadFormOptions();
  }

  protected closeCreation(): void {
    if (this.isSubmitting()) return;
    this.formOptionsRequest?.unsubscribe();
    this.formOptionsRequest = null;
    this.creationSource.set(null);
  }

  protected loadFormOptions(): void {
    if (this.creationSource() === null || this.isFormLoading()) return;
    this.isFormLoading.set(true);
    this.formLoadFailed.set(false);
    this.formOptionsRequest = this.facade.getFormOptions().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isFormLoading.set(false)),
    ).subscribe({
      next: options => {
        this.systems.set(options.systems);
        this.styles.set(options.styles);
        this.triggers.set(options.triggers);
        this.languages.set(options.languages);
      },
      error: () => this.formLoadFailed.set(true),
    });
  }

  protected saveSession(submit: ISessionFormSubmitData): void {
    const sourceKind = this.creationSource();
    if (!sourceKind || this.isBusy() || this.isFormLoading() || this.formLoadFailed()) return;
    this.isSubmitting.set(true);
    this.facade.createSession(submit, sourceKind).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isSubmitting.set(false)),
    ).subscribe({
      next: session => {
        this.creationSource.set(null);
        this.sourceControl.setValue(sourceKind);
        this.sessionControl.setValue(session.id, { emitEvent: false });
        this.selectionChange.emit({ sourceKind, sessionId: session.id });
        this.toast.success({
          summary: this.i18n.sessionToast().saveSuccessSummary,
          detail: this.i18n.sessionToast().saveSuccessDetail,
        });
      },
      error: () => this.toast.danger({
        summary: this.i18n.sessionToast().saveFailedSummary,
        detail: this.i18n.sessionToast().saveFailedDetail,
      }),
    });
  }
}
