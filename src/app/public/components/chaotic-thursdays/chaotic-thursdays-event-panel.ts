import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import { buildEventHostSignupRoute } from '../../../core/configs/event-signup.config';
import { IEventSlotCardVm } from '../../../core/interfaces/i-event-slot-card';
import { Auth } from '../../../core/services/auth/auth';
import { Storage } from '../../../core/services/storage/storage';
import { normalizeText } from '../../../core/utils/normalize-text';
import { formatMoney } from '../../../core/utils/pricing';
import { hasMinimumRole } from '../../../core/utils/roles';
import { resolvePublicStorageUrl } from '../../../core/utils/storage-url';
import { formatTimeRangeLabel } from '../../../core/utils/time';
import { getGmPublicProfileDisplayName } from '../../../core/utils/user-display';
import { EventSlots } from '../../common/event-slots/event-slots';
import { LoadingOverlay } from '../../common/loading-overlay/loading-overlay';
import { OccurrenceSwitcher } from '../../common/occurrence-switcher/occurrence-switcher';
import { ChaoticThursdaysFacade } from './chaotic-thursdays.facade';
import { createChaoticThursdaysI18n } from './chaotic-thursdays.i18n';

@Component({
  selector: 'app-chaotic-thursdays-event-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    TabsModule,
    EventSlots,
    LoadingOverlay,
    OccurrenceSwitcher,
  ],
  templateUrl: './chaotic-thursdays-event-panel.html',
})
export class ChaoticThursdaysEventPanel implements OnInit {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly storage = inject(Storage);

  readonly facade = inject(ChaoticThursdaysFacade);
  readonly i18n =
    input.required<ReturnType<typeof createChaoticThursdaysI18n>>();

  readonly slotSelect = output<IEventSlotCardVm>();
  readonly gmSelect = output<IEventSlotCardVm>();

  readonly mobileEditionControl = new FormControl('', { nonNullable: true });

  readonly cityLabel = computed(
    () =>
      normalizeText(this.facade.selectedEdition()?.city) ||
      this.i18n().heroInfo().cityMissing,
  );

  readonly placeLabel = computed(
    () =>
      normalizeText(this.facade.selectedEdition()?.venueName) ||
      this.i18n().heroInfo().placeMissing,
  );

  readonly addressLabel = computed(
    () =>
      normalizeText(this.facade.selectedEdition()?.venueAddress) ||
      this.i18n().heroInfo().addressMissing,
  );

  readonly scheduleLabel = computed(
    () =>
      formatTimeRangeLabel(
        this.facade.selectedEdition()?.startTime,
        this.facade.selectedEdition()?.endTime,
      ) || this.i18n().heroInfo().scheduleMissing,
  );

  readonly priceLabel = computed(() => {
    const edition = this.facade.selectedEdition();

    if (!edition) {
      return this.i18n().heroInfo().priceMissing;
    }

    return (
      normalizeText(edition.priceLabel) ||
      (edition.priceAmount === null
        ? null
        : formatMoney(edition.priceAmount, edition.priceCurrency)) ||
      this.i18n().heroInfo().priceMissing
    );
  });

  readonly loadErrorMessage = computed(() => {
    const loadError = this.facade.loadError();
    const errors = this.i18n().errors();

    if (!loadError) {
      return '';
    }

    switch (loadError.kind) {
      case 'core-not-found':
        return errors.coreNotFound;
      case 'no-editions':
        return errors.noEditions;
      case 'invalid-default':
        return errors.invalidDefault;
      case 'grouped-rpc':
        return errors.groupedRpc;
      case 'occurrences':
        return errors.occurrences;
      case 'program':
        return errors.program;
    }
  });

  readonly slotItems = this.facade.selectedProgramItems;

  readonly slotCards = computed<IEventSlotCardVm[]>(() =>
    this.slotItems().map((item) => ({
      id: item.id,
      gmProfileId: item.host.profile.id ?? null,
      title: item.session.title,
      imageUrl: resolvePublicStorageUrl(this.storage, item.session.image),
      gmDisplayName: getGmPublicProfileDisplayName(item.host) || null,
      system: item.session.system ?? null,
      languages: item.session.languages ?? [],
      difficultyLevel: item.session.difficultyLevel,
      styles: item.session.styles,
      triggers: item.session.triggers,
      minAge: item.session.minAge,
      description: item.session.description,
      isEmpty: false,
      canOpenDetails: true,
      canOpenGmProfile: !!item.host.profile.id,
    })),
  );

  readonly slotCount = computed(() => {
    const occurrence = this.facade.selectedOccurrence();

    if (occurrence) {
      return occurrence.slotCapacity;
    }

    return this.facade.selectedEdition()?.defaultSlotCapacity ?? 0;
  });

  readonly canHostSignup = computed(() =>
    hasMinimumRole(this.auth.user(), 'gm'),
  );

  private readonly syncMobileEditionEffect = effect(() => {
    const selectedEventId = this.facade.selectedEventId() ?? '';

    if (this.mobileEditionControl.value !== selectedEventId) {
      this.mobileEditionControl.setValue(selectedEventId, {
        emitEvent: false,
      });
    }
  });

  ngOnInit(): void {
    this.facade.load();
  }

  onEditionSelect(eventId: string): void {
    this.facade.selectEdition(eventId);
  }

  onOccurrenceSelect(index: number): void {
    this.facade.selectOccurrence(index);
  }

  onRetry(): void {
    this.facade.retry();
  }

  onHostSignupClick(): void {
    const occurrenceDate = this.facade.selectedOccurrence()?.occurrenceDate;
    const eventSlug = this.facade.selectedEdition()?.slug;

    if (!occurrenceDate || !eventSlug) {
      return;
    }

    void this.router.navigate(
      buildEventHostSignupRoute(eventSlug, occurrenceDate),
    );
  }
}
