import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import { buildSiteUrl } from '../../../core/config/site';
import { Navigation } from '../../../core/services/navigation/navigation';
import { Seo } from '../../../core/services/seo/seo';
import { MeetingFormat } from '../../../core/types/i18n/join-the-party';
import {
  createEventStructuredData,
  createOfferStructuredData,
} from '../../../core/utils/structured-data';
import {
  JOIN_THE_PARTY_BENEFIT_ICONS,
  JOIN_THE_PARTY_STEP_ICONS,
} from './join-the-party.config';
import { createJoinThePartyI18n } from './join-the-party.i18n';
import { JoinThePartySummary } from './join-the-party-summary';

@Component({
  selector: 'app-join-the-party',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    AnimateOnScrollModule,
    SelectModule,
    TabsModule,
    JoinThePartySummary,
  ],
  templateUrl: './join-the-party.html',
  styleUrl: './join-the-party.scss',
  providers: [provideTranslocoScope('joinTheParty', 'common')],
})
export class JoinTheParty {
  private readonly navigation = inject(Navigation);
  private readonly seo = inject(Seo);
  private readonly pageUrl = buildSiteUrl('/join-the-party');

  readonly i18n = createJoinThePartyI18n(
    JOIN_THE_PARTY_BENEFIT_ICONS,
    JOIN_THE_PARTY_STEP_ICONS,
  );

  readonly meetingFormat = signal<MeetingFormat>('inPerson');
  readonly meetingFormatOptions = computed(() => [
    {
      value: 'inPerson',
      label: this.i18n.meetingFormat().inPerson,
    },
    {
      value: 'online',
      label: this.i18n.meetingFormat().online,
    },
  ]);
  readonly mobileMeetingFormatControl =
    new FormControl<MeetingFormat>(this.meetingFormat(), {
      nonNullable: true,
    });
  readonly discordHref = computed(() => {
    const discord = this.navigation
      .social()
      .find(({ labelKey }) => labelKey === 'Discord');

    if (!discord) {
      throw new Error(
        '[JOIN_THE_PARTY] Discord entry is missing from Navigation.social().',
      );
    }

    return discord.href;
  });

  private readonly syncMobileMeetingFormatEffect = effect(() => {
    const format = this.meetingFormat();

    if (this.mobileMeetingFormatControl.value !== format) {
      this.mobileMeetingFormatControl.setValue(format, { emitEvent: false });
    }
  });

  private readonly applySeoEffect = effect(() => {
    const seo = this.i18n.seo();

    this.seo.apply({
      title: seo.title,
      description: seo.description,
      canonicalUrl: this.pageUrl,
      structuredData: createEventStructuredData({
        id: `${this.pageUrl}#event`,
        url: this.pageUrl,
        name: this.i18n.nav().join,
        description: seo.description,
        eventSchedule: {
          '@type': 'Schedule',
          repeatFrequency: 'P1W',
          byDay: 'https://schema.org/Wednesday',
          startTime: '18:00',
        },
        offers: createOfferStructuredData({
          price: '0',
          url: this.pageUrl,
        }),
      }),
    });
  });

  onMobileMeetingFormatChange(format: MeetingFormat): void {
    this.meetingFormat.set(format);
  }
}
