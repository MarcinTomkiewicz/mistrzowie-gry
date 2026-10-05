import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { startWith } from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { SessionDetails } from '../../../common/session-details/session-details';
import { StaffingSessionSelectorFacade } from '../../../core/facades/staffing/staffing-session-selector-facade';
import type { ISelectOption } from '../../../core/interfaces/i-select-option';
import type { StaffingSessionReference } from '../../../core/interfaces/staffing-session-reference';
import { Auth } from '../../../core/services/auth/auth';
import { GM_STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import type { SessionSourceKind } from '../../../core/types/session-source';
import { createStaffingSessionSelectorI18n } from './staffing-session-selector.i18n';

@Component({
  selector: 'app-staffing-session-selector',
  imports: [ReactiveFormsModule, ButtonModule, SelectModule, LoadingOverlay, SessionDetails],
  templateUrl: './staffing-session-selector.html',
  providers: [provideTranslocoScope(GM_STAFFING_SCOPE, 'common')],
})
export class StaffingSessionSelector {
  readonly selection = input<StaffingSessionReference | null>(null);
  readonly selectionChange = output<StaffingSessionReference>();
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
  protected readonly isBusy = computed(() => this.busy() || this.facade.isLoading());
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

    this.sourceControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.sessionControl.setValue(this.selectedSessionId(), { emitEvent: false });
      this.showDetails.set(false);
    });

    this.sessionControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(sessionId => {
      if (sessionId !== null && !this.isBusy()) {
        this.selectionChange.emit({ sourceKind: this.sourceControl.value, sessionId });
      }
    });

    this.facade.load();
  }
}
