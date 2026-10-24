import { Component, computed, DestroyRef, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { map, Observable } from 'rxjs';

import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { parseIsoDate } from '../../../../core/utils/date';
import { scrollElementIntoViewWhenReady } from '../../../../core/utils/scroll';
import { createTimeZoneOptions } from '../../../../core/utils/time-zone';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalCityFields } from './event-global-city-fields';
import { EventGlobalDraftController } from './event-global-draft-controller';

@Component({
  selector: 'app-event-core-editions',
  imports: [RouterLink, ReactiveFormsModule, ButtonModule, MessageModule, EventGlobalCityFields],
  templateUrl: './event-core-editions.html',
  host: { class: 'd-block w-100' },
})
export class EventCoreEditions {
  readonly core = input.required<IEventCoreDetail>();
  readonly legacyEditing = input.required<boolean>();
  readonly addCityDisabled = input(false);
  readonly cityAdded = output<IEventCoreDetail>();
  protected readonly globalDraft = inject(EventGlobalDraftController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly errorMessage = signal<string | null>(null);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toast = inject(UiToast);
  private readonly confirm = inject(UiConfirm);
  private readonly platform = inject(Platform);
  private readonly initialDate = new Date();
  protected readonly timezones = computed(() => {
    const schedule = this.globalDraft.calendar()?.schedule;
    const date = parseIsoDate(schedule?.kind === 'single' ? schedule.date
      : schedule?.kind === 'exact_dates' ? [...schedule.dates].sort()[0] : schedule?.startDate);
    return createTimeZoneOptions(date
      ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)) : this.initialDate);
  });

  constructor() {
    this.destroyRef.onDestroy(this.platform.onWindow('beforeunload', event => {
      if (!this.globalDraft.cityEditing() || this.globalDraft.cityState() === 'created' ||
        (!this.globalDraft.cityBusy() && this.globalDraft.cityState() === 'idle' && this.globalDraft.cityForm.pristine)) return;
      event.preventDefault();
      event.returnValue = '';
    }));
  }

  protected openCity(): void {
    if (this.addCityDisabled()) return;
    this.errorMessage.set(null);
    this.globalDraft.openCity(this.core());
    this.focusCityControl('#additional-city-city');
  }

  protected closeCity(): void {
    this.globalDraft.closeCity();
    if (!this.globalDraft.cityEditing()) {
      this.errorMessage.set(null);
      this.focusCityControl('#additional-city-open button');
    }
  }

  protected submitCity(): void {
    if (this.globalDraft.cityBusy() || this.addCityDisabled()) return;
    this.globalDraft.cityForm.markAllAsTouched();
    if (this.globalDraft.cityState() === 'idle' && this.globalDraft.cityForm.invalid) {
      this.toast.danger({ summary: this.i18n.commonForm().invalidSummary, detail: this.i18n.commonForm().invalid });
      this.focusCityControl('#additional-city-form input.ng-invalid, #additional-city-form .ng-invalid input');
      return;
    }
    this.errorMessage.set(null);
    this.globalDraft.addCity(this.core()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: core => {
        this.cityAdded.emit(core);
        this.focusCityControl('#additional-city-open button');
        this.toast.success({ summary: this.i18n.city().saved });
      },
      error: (error: unknown) => {
        const state = this.globalDraft.cityState();
        const detail = state === 'uncertain' ? this.i18n.city().uncertain
          : state === 'created' ? this.i18n.city().readbackFailed
          : resolveEventEditionAdminErrorMessage(error, this.i18n.editionRpcErrors(), this.i18n.commonErrors().concurrentModification);
        this.errorMessage.set(detail);
        if (state === 'uncertain') this.toast.warn({ summary: detail });
        else this.toast.danger({ summary: this.i18n.toast().saveFailedSummary, detail });
      },
    });
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.globalDraft.cityBusy() || this.globalDraft.cityState() === 'uncertain') return false;
    if (this.globalDraft.cityState() === 'created' || this.globalDraft.cityForm.pristine) return true;
    return this.confirm.modalDecision({
      header: this.i18n.city().action, message: this.i18n.city().leaveConfirmation,
      acceptLabel: this.i18n.city().discard, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(map(accepted => accepted && !this.destroyRef.destroyed && !this.globalDraft.cityBusy() && this.globalDraft.cityState() === 'idle'));
  }

  private focusCityControl(selector: string): void {
    scrollElementIntoViewWhenReady(() => {
      if (this.destroyRef.destroyed) return null;
      const control = this.host.nativeElement.querySelector<HTMLElement>(selector);
      control?.focus({ preventScroll: true });
      return control;
    }, { block: 'center' });
  }
}
