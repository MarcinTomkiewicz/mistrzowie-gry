import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { Platform } from './core/services/platform/platform';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, ButtonModule, ToggleSwitchModule, ToastModule, DialogModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [MessageService],
})
export class App {
  private readonly platform = inject(Platform);
  private readonly messages = inject(MessageService);

  /**
   * true => light (html[data-theme="light"])
   * false => dark (domyślny, bez atrybutu)
   */
  readonly isLightTheme = signal(false);

  /** Demo modal */
  readonly isDialogOpen = signal(false);

  constructor() {
    if (!this.platform.isBrowser) return;

    const root = document.documentElement;
    this.isLightTheme.set(root.getAttribute('data-theme') === 'light');
  }

  onThemeToggle(): void {
    this.applyTheme(this.isLightTheme() ? 'light' : 'dark');
  }

  private applyTheme(theme: 'dark' | 'light'): void {
    if (!this.platform.isBrowser) return;

    const root = document.documentElement;
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
