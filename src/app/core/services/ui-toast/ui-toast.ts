import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { defer, Observable, of } from 'rxjs';
import { PrimeToastSeverity, ToastKind, ToastOptions } from '../../types/toast';

@Injectable({
  providedIn: 'root',
})
export class UiToast {
  private readonly messages = inject(MessageService);
  private hostLoader: (() => Observable<void>) | null = null;
  private hostReady = false;

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

  registerHostLoader(loader: () => Observable<void>): void {
    this.hostLoader = loader;
  }

  markHostReady(): void {
    this.hostReady = true;
  }

  show(kind: ToastKind, options: ToastOptions): void {
    this.ensureHost().subscribe(() => {
      this.messages.add({
        severity: this.severityMap[kind],
        summary: options.summary,
        detail: options.detail,
        life: options.life ?? this.defaultLife,
        styleClass: this.styleClassMap[kind],
        icon: options.icon ?? this.iconMap[kind],
      });
    });
  }

  private ensureHost(): Observable<void> {
    return defer(() => this.hostReady || !this.hostLoader ? of(undefined) : this.hostLoader());
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
