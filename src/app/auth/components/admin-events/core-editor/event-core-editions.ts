import { Component, computed, DestroyRef, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { EventGlobalCityCopy } from '../../../../core/types/i18n/event-global-draft';
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
  imports: [RouterLink, FormsModule, ReactiveFormsModule, ButtonModule, MessageModule, FloatLabelModule, SelectModule, EventGlobalCityFields],
  templateUrl: './event-core-editions.html',
  host: { class: 'd-block w-100' },
})
export class EventCoreEditions {
  readonly core = input.required<IEventCoreDetail>();
  readonly legacyEditing = input.required<boolean>();
  readonly addCityDisabledReason = input<'metadata' | 'schedule' | 'price' | null>(null);
  readonly selectionDisabled = input(false);
  readonly cityAdded = output<IEventCoreDetail>();
  protected readonly globalDraft = inject(EventGlobalDraftController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly errorMessage = signal<string | null>(null);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toast = inject(UiToast);
  private readonly initialDate = new Date();
  protected readonly editionOptions = computed(() => this.globalDraft.calendar()?.cities.map(city => ({
    value: city.editionId, label: city.city,
  })) ?? []);
  protected readonly editionErrorMessage = computed(() => {
    const error = this.globalDraft.editionReadError();
    return error === null ? null : resolveEventEditionAdminErrorMessage(error, this.i18n.editionRpcErrors(), this.i18n.commonErrors().concurrentModification);
  });
  protected readonly addCityBlocker = computed<keyof EventGlobalCityCopy['blockers'] | null>(() => this.globalDraft.addCityBlocker(this.core()) ??
    this.addCityDisabledReason() ?? (this.globalDraft.cityBusy() ? 'saving'
      : this.globalDraft.cityState() === 'uncertain' ? 'uncertain' : this.globalDraft.cityState() === 'created' ? 'readback'
      : this.globalDraft.cityEditing() ? 'editing' : null));
  protected readonly citySaveBlocked = computed(() => this.globalDraft.cityBusy() || this.globalDraft.isChecking() || this.addCityDisabledReason() !== null ||
    (this.globalDraft.cityState() === 'idle' && this.globalDraft.addCityBlocker(this.core()) !== null));
  protected readonly timezones = computed(() => {
    const schedule = this.globalDraft.calendar()?.schedule;
    const date = parseIsoDate(schedule?.kind === 'single' ? schedule.date
      : schedule?.kind === 'exact_dates' ? [...schedule.dates].sort()[0] : schedule?.startDate);
    return createTimeZoneOptions(date
      ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)) : this.initialDate);
  });

  protected selectEdition(value: unknown): void {
    if (typeof value !== 'string' || this.legacyEditing() || this.selectionDisabled()) return;
    this.globalDraft.selectEdition(value);
  }

  protected openCity(): void {
    if (this.addCityBlocker() !== null) return;
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
    if (this.citySaveBlocked()) return;
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

  private focusCityControl(selector: string): void {
    scrollElementIntoViewWhenReady(() => {
      if (this.destroyRef.destroyed) return null;
      const control = this.host.nativeElement.querySelector<HTMLElement>(selector);
      control?.focus({ preventScroll: true });
      return control;
    }, { block: 'center' });
  }
}
