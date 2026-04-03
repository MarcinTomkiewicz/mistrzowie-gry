import { inject, Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import {
  BasePopupOptions,
  DecisionPopupOptions,
  PopupTargetEvent,
} from '../../types/popup';

@Injectable({
  providedIn: 'root',
})
export class UiConfirm {
  private readonly confirmation = inject(ConfirmationService);
  private hostLoader: (() => Promise<void>) | null = null;
  private hostReady = false;
  private hostPromise: Promise<void> | null = null;

  registerHostLoader(loader: () => Promise<void>): void {
    this.hostLoader = loader;
  }

  markHostReady(): void {
    this.hostReady = true;
    this.hostPromise = Promise.resolve();
  }

  info(event: PopupTargetEvent, options: BasePopupOptions): void {
    void this.confirm(event, {
      message: options.message,
      icon: options.icon ?? 'pi pi-tied-scroll',
      rejectVisible: false,
      accept: options.accept ?? (() => {}),
      acceptLabel: options.acceptLabel,
      acceptButtonProps: {
        severity: 'info',
      },
    });
  }

  warn(event: PopupTargetEvent, options: BasePopupOptions): void {
    void this.confirm(event, {
      message: options.message,
      icon: options.icon ?? 'pi pi-exclamation-triangle',
      rejectVisible: false,
      accept: options.accept ?? (() => {}),
      acceptLabel: options.acceptLabel,
      acceptButtonProps: {
        severity: 'warn',
      },
    });
  }

  danger(event: PopupTargetEvent, options: BasePopupOptions): void {
    void this.confirm(event, {
      message: options.message,
      icon: options.icon ?? 'pi pi-times-circle',
      rejectVisible: false,
      accept: options.accept ?? (() => {}),
      acceptLabel: options.acceptLabel,
      acceptButtonProps: {
        severity: 'danger',
      },
    });
  }

  decision(event: PopupTargetEvent, options: DecisionPopupOptions): void {
    void this.confirm(event, {
      message: options.message,
      icon: options.icon ?? 'pi pi-question-circle',
      accept: options.accept ?? (() => {}),
      reject: options.reject ?? (() => {}),
      acceptLabel: options.acceptLabel,
      rejectLabel: options.rejectLabel,
      acceptButtonProps: {
        severity: 'info',
      },
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true,
      },
    });
  }

  private async confirm(
    event: PopupTargetEvent,
    config: Record<string, unknown>,
  ): Promise<void> {
    const target = event.currentTarget as HTMLElement | null;

    await this.ensureHost();

    if (!target) {
      return;
    }

    this.confirmation.confirm({
      ...config,
      target,
    });
  }

  private async ensureHost(): Promise<void> {
    if (this.hostReady) {
      return;
    }

    if (!this.hostLoader) {
      return;
    }

    if (!this.hostPromise) {
      this.hostPromise = this.hostLoader().catch((error) => {
        this.hostPromise = null;
        throw error;
      });
    }

    await this.hostPromise;
  }
}
