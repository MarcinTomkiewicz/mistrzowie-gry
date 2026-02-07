import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { Platform } from '../../../core/services/platform/platform';
import { Seo } from '../../../core/services/seo/seo';
import { SeoRichText } from './seo-rich-text/seo-rich-text';
import { Programs } from './programs/programs';
import { Problems } from './problems/problems';
import { HeroCarousel } from './hero-carousel/hero-carousel';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeroCarousel,
    Problems,
    Programs,
    SeoRichText,
    FormsModule,
    ButtonModule,
    ToggleSwitchModule,
    ToastModule,
    DialogModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  providers: [MessageService],
})
export class Home {
  private readonly platform = inject(Platform);
  private readonly seo = inject(Seo);
  private readonly messages = inject(MessageService);

  /**
   * true => light (html[data-theme="light"])
   * false => dark (domyślny, bez atrybutu)
   */
  readonly isLightTheme = signal(false);

  /** Demo modal */
  readonly isDialogOpen = signal(false);

  constructor() {
    // Global SEO fallback (App-level). Strony docelowo nadpisują to własnymi danymi.
    this.seo.apply({
      title: 'Mistrzowie Gry',
      description:
        'Mistrzowie Gry — centrum RPG, oferta, wydarzenia i społeczność.',
      og: {
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
      },
    });

    // SSR-safe theme init
    if (!this.platform.isBrowser) return;

    const doc = this.platform.document;
    if (!doc) return;

    const root = doc.documentElement;
    this.isLightTheme.set(root.getAttribute('data-theme') === 'light');
  }

  onThemeToggle(): void {
    this.applyTheme(this.isLightTheme() ? 'light' : 'dark');
  }

  private applyTheme(theme: 'dark' | 'light'): void {
    if (!this.platform.isBrowser) return;

    const doc = this.platform.document;
    if (!doc) return;

    const root = doc.documentElement;

    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
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
    // RULE: warn = arcane (Twoja decyzja)
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
