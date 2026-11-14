import { afterNextRender, Component, computed, effect, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import { OccurrenceSwitcher } from '../../../../common/occurrence-switcher/occurrence-switcher';
import type { AdminGlobalEventPagePreview } from '../../../../core/interfaces/i-admin-global-event-preview';
import type { IEventSlotCardVm } from '../../../../core/interfaces/i-event-slot-card';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { Storage } from '../../../../core/services/storage/storage';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel, getTodayIso, selectUpcomingOrLatestDate } from '../../../../core/utils/date';
import { formatMoney } from '../../../../core/utils/pricing';
import { createPublicEventProgramCards, formatPublicEventProgramTime, getPublicEventProgramTimeRange, groupPublicEventProgramEntries } from '../../../../core/utils/public-event-program-cards';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { getTimeRangeBounds } from '../../../../core/utils/time-format';
import { EventSlots } from '../../../../public/common/event-slots/event-slots';
import { createEventPageI18n } from '../../../../public/components/event-page/event-page.i18n';
import { SessionDialog } from '../../../../public/components/session-dialog/session-dialog';
import { presentEventGlobalPreviewError } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-global-page-preview',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, MessageModule, SelectModule, TabsModule, OccurrenceSwitcher, EventSlots, SessionDialog],
  providers: [provideTranslocoScope('eventPage', 'common')],
  templateUrl: './event-global-page-preview.html',
})
export class EventGlobalPagePreview {
  readonly coreId = input.required<string>();
  readonly disabled = input(false);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly publicI18n = createEventPageI18n();
  protected readonly copy = this.i18n.pagePreview;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatProgramTime = formatPublicEventProgramTime;
  private readonly admin = inject(EventAdmin);
  private readonly auth = inject(Auth);
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);
  private readonly browserReady = signal(false);
  protected readonly isAdmin = computed(() => this.auth.hasRole('admin'));
  protected readonly visible = signal(false);
  protected readonly loading = signal(false);
  protected readonly result = signal<AdminGlobalEventPagePreview | null>(null);
  protected readonly error = signal<unknown | null>(null);
  protected readonly errorFields = computed(() => presentEventGlobalPreviewError(this.error()));
  private readonly selectedEditionId = linkedSignal<string | undefined>(() => { this.coreId(); return undefined; });
  private readonly selectedDate = linkedSignal<string | undefined>(() => { this.coreId(); return undefined; });
  protected readonly selectedEditionControl = new FormControl('', { nonNullable: true });
  private readonly readAttempt = signal(0);
  private readonly sessionId = signal<string | null>(null);
  protected readonly page = computed(() => this.result()?.page ?? null);
  protected readonly edition = computed(() => this.page()?.editions.find(city => city.id === this.page()?.selectedEditionId) ?? null);
  protected readonly cover = computed(() => resolvePublicStorageUrl(this.storage, this.edition()?.coverImagePath ?? this.page()?.core.coverImagePath));
  protected readonly price = computed(() => {
    const edition = this.edition();
    if (!edition) return null;
    if (edition.priceAmount === null) return this.publicI18n.page().freeLabel;
    if (!edition.priceCurrency) return this.i18n.commonValues().notProvided;
    const amount = formatMoney(edition.priceAmount, edition.priceCurrency);
    return edition.priceBasis ? `${amount} / ${this.i18n.priceBases()[edition.priceBasis]}` : amount;
  });
  protected readonly timeRange = computed(() => {
    const page = this.page();
    if (!page?.selectedDate) return null;
    const blocks = page.globalDates.find(day => day.date === page.selectedDate)
      ?.cities.find(city => city.editionId === page.selectedEditionId)?.timeBlocks ?? [];
    return getPublicEventProgramTimeRange(page.program, getTimeRangeBounds(blocks));
  });
  protected readonly occurrenceOptions = computed(() => {
    const page = this.page();
    return page?.globalDates.filter(day => day.cities.some(city => city.editionId === page.selectedEditionId && city.includedInPreview))
      .sort((left, right) => left.date.localeCompare(right.date))
      .map(day => ({ id: day.date, occurrenceDate: day.date, label: formatDateLabel(day.date, 'pl-PL', true) })) ?? [];
  });
  protected readonly selectedOccurrenceIndex = computed(() =>
    Math.max(0, this.occurrenceOptions().findIndex(day => day.occurrenceDate === this.page()?.selectedDate)));
  protected readonly groups = computed(() => {
    const page = this.page();
    if (!page) return [];
    return groupPublicEventProgramEntries(page.program, this.publicI18n.program(), page.core.name ?? '').map(group => ({
      key: group.key,
      label: group.label,
      cards: createPublicEventProgramCards(group.entries, this.storage, this.publicI18n.program(),
        this.i18n.commonValues().notProvided, this.publicI18n.roles().gm, page.core.name ?? '', group)
        .map(card => ({ ...card, canOpenGmProfile: false })),
    }));
  });
  protected readonly selectedSession = computed(() => this.groups().flatMap(group => group.cards)
    .find(card => card.id === this.sessionId() && card.canOpenDetails) ?? null);

  constructor() {
    // Unpublished data is fetched only in the authenticated browser and never transferred to public SSR.
    afterNextRender(() => this.browserReady.set(true));
    effect(onCleanup => {
      const allowed = this.browserReady() && this.isAdmin() && this.visible() && !this.disabled();
      this.auth.userId();
      const coreId = this.coreId();
      const editionId = this.selectedEditionId();
      const date = this.selectedDate();
      this.readAttempt();
      untracked(() => {
        this.result.set(null);
        this.error.set(null);
        this.sessionId.set(null);
        this.loading.set(false);
        if (!allowed) return;
        this.loading.set(true);
        const request = this.admin.previewGlobalEventPage(coreId, editionId, date).subscribe({
          next: result => {
            const page = result.page;
            const city = page?.editions.find(city => city.id === page.selectedEditionId);
            if (date === undefined && page && city) {
              const preferred = selectUpcomingOrLatestDate(page.globalDates.filter(day =>
                day.cities.some(row => row.editionId === city.id && row.includedInPreview)).map(day => day.date),
              getTodayIso(new Date(), city.timezone));
              if (preferred !== null && preferred !== page.selectedDate) {
                this.selectedEditionId.set(city.id);
                this.selectedDate.set(preferred);
                return;
              }
            }
            if (page) this.selectedEditionControl.setValue(page.selectedEditionId, { emitEvent: false });
            this.result.set(result);
            this.loading.set(false);
          },
          error: (error: unknown) => {
            this.loading.set(false);
            this.error.set(error);
            this.toast.danger({ summary: this.copy().failed,
              detail: this.errorFields().find(field => field.key === 'message')?.value });
          },
        });
        onCleanup(() => request.unsubscribe());
      });
    });
  }

  protected open(): void {
    if (!this.browserReady() || !this.isAdmin() || this.disabled()) return;
    this.selectedEditionId.set(undefined);
    this.selectedDate.set(undefined);
    this.visible.set(true);
  }

  protected close(): void {
    this.visible.set(false);
    this.result.set(null);
    this.sessionId.set(null);
  }

  protected selectCity(id: string | number | undefined): void {
    if (typeof id !== 'string' || this.disabled() || this.loading() || !this.page()?.editions.some(city => city.id === id) || this.page()?.selectedEditionId === id) return;
    this.selectedEditionId.set(id);
    this.selectedDate.set(undefined);
  }

  protected selectOccurrence(index: number): void {
    const date = this.occurrenceOptions()[index]?.occurrenceDate;
    if (!date || this.disabled() || this.loading() || this.page()?.selectedDate === date) return;
    this.selectedEditionId.set(this.page()?.selectedEditionId);
    this.selectedDate.set(date);
  }

  protected refresh(): void { if (!this.disabled() && !this.loading()) this.readAttempt.update(value => value + 1); }
  protected selectSession(card: IEventSlotCardVm): void { if (card.canOpenDetails && card.sessionDetails) this.sessionId.set(card.id); }
  protected closeSession(): void { this.sessionId.set(null); }
}
