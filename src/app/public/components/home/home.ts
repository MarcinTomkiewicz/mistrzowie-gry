import { Component, inject, signal } from '@angular/core';

import { MessageService } from 'primeng/api';

import { Seo } from '../../../core/services/seo/seo';
import { Theme } from '../../../core/services/theme/theme';
import { HeroCarousel } from './hero-carousel/hero-carousel';
import { Problems } from './problems/problems';
import { Programs } from './programs/programs';
import { SeoRichText } from './seo-rich-text/seo-rich-text';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeroCarousel,
    Problems,
    Programs,
    SeoRichText,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly seo = inject(Seo);
  private readonly messages = inject(MessageService);

  readonly theme = inject(Theme);
  readonly isDialogOpen = signal(false);

  constructor() {
    this.seo.apply({
      title: 'Gry fabularne na wyciągnięcie ręki - Mistrzowie Gry',
      description:
        'Nie przejmuj się brakiem Mistrza Gry ani czytaniem podręczników. Organizujemy sesje RPG dla początkujących, prowadzimy gry fabularne, pomagamy zacząć grać i znaleźć drużynę.',
      og: {
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
      },
    });
  }

  onThemeToggle(): void {
    this.theme.toggle();
  }

  // === Toast triggers (MG semantics) ===

  toastInfo(): void {
    this.messages.add({
      severity: 'info',
      summary: 'Info',
      detail: 'To jest toast info (mg-color-info).',
      life: 3500,
      styleClass: 'mg-toast mg-toast--info',
    });
  }

  toastSuccess(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Success',
      detail: 'To jest toast success (mg-color-success).',
      life: 3500,
      styleClass: 'mg-toast mg-toast--success',
    });
  }

  toastDanger(): void {
    this.messages.add({
      severity: 'error',
      summary: 'Danger',
      detail: 'To jest toast danger (mg-color-danger).',
      life: 3500,
      styleClass: 'mg-toast mg-toast--danger',
    });
  }

  toastArcane(): void {
    this.messages.add({
      severity: 'warn',
      summary: 'Arcane',
      detail: 'To jest toast arcane (mg-color-arcane).',
      life: 3500,
      styleClass: 'mg-toast mg-toast--arcane',
    });
  }

  // === Dialog demo ===

  openDialog(): void {
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  confirmDialog(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Zatwierdzone',
      detail: 'Kliknięto „Potwierdź” w modalu.',
      life: 2500,
      styleClass: 'mg-toast mg-toast--success',
    });

    this.closeDialog();
  }
}