import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PrimeToastSeverity, ToastKind, ToastOptions } from '../../types/toast';

@Injectable({
  providedIn: 'root',
})
export class UiToast {
  private readonly messages = inject(MessageService);
  private hostLoader: (() => Promise<void>) | null = null;
  private hostReady = false;
  private hostPromise: Promise<void> | null = null;

  private readonly defaultLife = 3500;

  private readonly severityMap: Record<ToastKind, PrimeToastSeverity> = {
    info: PrimeToastSeverity.info,
    success: PrimeToastSeverity.success,
    warn: PrimeToastSeverity.warn,
    danger: PrimeToastSeverity.error,
    arcane: PrimeToastSeverity.warn,
  };

  private readonly styleClassMap: Record<ToastKind, string> = {
    info: 'mg-toast mg-toast--info',
    success: 'mg-toast mg-toast--success',
    warn: 'mg-toast mg-toast--warn',
    danger: 'mg-toast mg-toast--danger',
    arcane: 'mg-toast mg-toast--arcane',
  };

  private readonly iconMap: Record<ToastKind, string> = {
    info: 'pi pi-tied-scroll',
    success: 'pi pi-success-eagle',
    warn: 'pi pi-biohazard',
    danger: 'pi pi-danger-orc',
    arcane: 'pi pi-biohazard',
  };

  registerHostLoader(loader: () => Promise<void>): void {
    this.hostLoader = loader;
  }

  markHostReady(): void {
    this.hostReady = true;
    this.hostPromise = Promise.resolve();
  }

  show(kind: ToastKind, options: ToastOptions): void {
    void this.showAsync(kind, options);
  }

  private async showAsync(
    kind: ToastKind,
    options: ToastOptions,
  ): Promise<void> {
    await this.ensureHost();

    this.messages.add({
      severity: this.severityMap[kind],
      summary: options.summary,
      detail: options.detail,
      life: options.life ?? this.defaultLife,
      styleClass: this.styleClassMap[kind],
      icon: options.icon ?? this.iconMap[kind],
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

  info(options: ToastOptions): void {
    this.show(ToastKind.info, options);
  }

  success(options: ToastOptions): void {
    this.show(ToastKind.success, options);
  }

  warn(options: ToastOptions): void {
    this.show(ToastKind.warn, options);
  }

  danger(options: ToastOptions): void {
    this.show(ToastKind.danger, options);
  }

  arcane(options: ToastOptions): void {
    this.show(ToastKind.arcane, options);
  }

  clear(): void {
    this.messages.clear();
  }
}
