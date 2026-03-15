import { inject, Injectable } from '@angular/core';
import { ConfirmationService, Confirmation } from 'primeng/api';
import { BasePopupOptions, DecisionPopupOptions, PopupTargetEvent } from '../../types/popup';

@Injectable({
  providedIn: 'root',
})
export class UiConfirm {
  private readonly confirmation = inject(ConfirmationService);

  info(event: PopupTargetEvent, options: BasePopupOptions): void {
    this.confirmation.confirm({
      target: event.currentTarget as HTMLElement,
      message: options.message,
      icon: options.icon ?? 'pi pi-tied-scroll',
      rejectVisible: false,
      accept: options.accept ?? (() => {}),
      acceptButtonProps: {
        label: options.acceptLabel,
        severity: 'info',
      },
    });
  }

  warn(event: PopupTargetEvent, options: BasePopupOptions): void {
    this.confirmation.confirm({
      target: event.currentTarget as HTMLElement,
      message: options.message,
      icon: options.icon ?? 'pi pi-exclamation-triangle',
      rejectVisible: false,
      accept: options.accept ?? (() => {}),
      acceptButtonProps: {
        label: options.acceptLabel,
        severity: 'warn',
      },
    });
  }

  danger(event: PopupTargetEvent, options: BasePopupOptions): void {
    this.confirmation.confirm({
      target: event.currentTarget as HTMLElement,
      message: options.message,
      icon: options.icon ?? 'pi pi-times-circle',
      rejectVisible: false,
      accept: options.accept ?? (() => {}),
      acceptButtonProps: {
        label: options.acceptLabel,
        severity: 'danger',
      },
    });
  }

  decision(event: PopupTargetEvent, options: DecisionPopupOptions): void {
    this.confirmation.confirm({
      target: event.currentTarget as HTMLElement,
      message: options.message,
      icon: options.icon ?? 'pi pi-question-circle',
      accept: options.accept ?? (() => {}),
      reject: options.reject ?? (() => {}),
      acceptButtonProps: {
        label: options.acceptLabel,
        severity: 'info',
      },
      rejectButtonProps: {
        label: options.rejectLabel,
        severity: 'secondary',
        outlined: true,
      },
    });
  }
}