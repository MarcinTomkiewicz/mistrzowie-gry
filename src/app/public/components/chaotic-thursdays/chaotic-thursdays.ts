import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { provideTranslocoScope } from '@jsverse/transloco';

import { Seo } from '../../../core/services/seo/seo';
import {
  CHAOTIC_HIGHLIGHT_ICONS,
  CHAOTIC_SPARK_DICE,
  CHAOTIC_STANDARDS_ICONS,
} from './chaotic-thursdays.config';
import { createChaoticThursdaysI18n } from './chaotic-thursdays.i18n';
import { ConfirmationService } from 'primeng/api';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';

@Component({
  selector: 'app-chaotic-thursdays',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    AccordionModule,
    TableModule,
  ],
  templateUrl: './chaotic-thursdays.html',
  styleUrl: './chaotic-thursdays.scss',
  providers: [provideTranslocoScope('chaoticThursdays', 'common')],
})
export class ChaoticThursdays {
  private readonly seo = inject(Seo);

  readonly i18n = createChaoticThursdaysI18n(
    CHAOTIC_HIGHLIGHT_ICONS,
    CHAOTIC_STANDARDS_ICONS,
  );

  private readonly uiConfirm = inject(UiConfirm);

  readonly sparkDice = CHAOTIC_SPARK_DICE;

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.seoTitle() || 'Chaotyczne Czwartki',
      description: this.i18n.seoDescription() || '',
    });
  });

  trackByIndex = (i: number) => i;

  showOutOfOrderPopup(event: Event): void {
    this.uiConfirm.info(event, {
      message: this.i18n.info().outOfOrder,
      acceptLabel: this.i18n.actions().ok,
    });
  }
}
