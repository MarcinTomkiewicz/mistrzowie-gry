import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { provideTranslocoScope } from '@jsverse/transloco';

import { Seo } from '../../../core/services/seo/seo';
import {
  JOIN_THE_PARTY_BENEFIT_ICONS,
  JOIN_THE_PARTY_STEP_ICONS,
} from './join-the-party.config';
import { createJoinThePartyI18n } from './join-the-party.i18n';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

@Component({
  selector: 'app-join-the-party',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, DividerModule, AnimateOnScrollModule],
  templateUrl: './join-the-party.html',
  styleUrl: './join-the-party.scss',
  providers: [provideTranslocoScope('joinTheParty', 'common')],
})
export class JoinTheParty {
  private readonly seo = inject(Seo);

  readonly i18n = createJoinThePartyI18n(
    JOIN_THE_PARTY_BENEFIT_ICONS,
    JOIN_THE_PARTY_STEP_ICONS,
  );

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.seoTitle() || 'Dołącz do Drużyny',
      description: this.i18n.seoDescription() || '',
    });
  });

  trackByIndex = (i: number) => i;
}