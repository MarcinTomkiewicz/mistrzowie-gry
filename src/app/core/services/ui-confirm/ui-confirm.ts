import { inject, Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import {
  BasePopupOptions,
  DecisionPopupOptions,
  ModalDecisionPopupOptions,
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
  private modalResult: ((accepted: boolean) => void) | null = null;
  private closeModalHost: (() => void) | null = null;
  readonly modalDecisionKey = 'ui-modal-decision';

  registerHostLoader(loader: () => Promise<void>): void {
    this.hostLoader = loader;
  }

  markHostReady(): void {
    this.hostReady = true;
    this.hostPromise = Promise.resolve();
  }

  registerModalDialogCloser(close: () => void): () => void {
    this.closeModalHost = close;
    return () => {
      if (this.closeModalHost !== close) return;
      this.closeModalHost = null;
      this.modalDialogHidden();
    };
  }

  modalDialogHidden(): void {
    this.modalResult?.(false);
  }

  modalDecision(options: ModalDecisionPopupOptions): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      if (this.modalResult) {
        subscriber.next(false);
        subscriber.complete();
        return;
      }
      const finish = (accepted: boolean): void => {
        if (this.modalResult === finish) this.modalResult = null;
        subscriber.next(accepted);
        subscriber.complete();
      };
      this.modalResult = finish;
      void this.ensureHost().then(() => {
        if (subscriber.closed) return;
        if (!this.hostReady || !this.closeModalHost) {
          finish(false);
          return;
        }
        this.confirmation.confirm({
          ...options,
          key: this.modalDecisionKey,
          icon: options.icon ?? 'pi pi-question-circle',
          closable: true,
          closeOnEscape: true,
          dismissableMask: true,
          defaultFocus: 'reject',
          accept: () => finish(true),
          reject: () => finish(false),
          acceptButtonProps: { severity: 'info', icon: options.acceptIcon },
          rejectButtonProps: { severity: 'secondary', icon: 'pi pi-interdiction', outlined: true },
        });
      }).catch(() => finish(false));
      return () => {
        if (this.modalResult !== finish) return;
        this.modalResult = null;
        this.closeModalHost?.();
      };
    });
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
        icon: options.acceptIcon,
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
        icon: options.acceptIcon,
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
        icon: options.acceptIcon,
      },
    });
  }

  /** Reports popup opening; accept/reject callbacks still carry the user's choice. */
  decision(event: PopupTargetEvent, options: DecisionPopupOptions): Promise<boolean> {
    return this.confirm(event, {
      message: options.message,
      icon: options.icon ?? 'pi pi-question-circle',
      accept: options.accept ?? (() => {}),
      reject: options.reject ?? (() => {}),
      acceptLabel: options.acceptLabel,
      rejectLabel: options.rejectLabel,
      acceptButtonProps: {
        severity: 'info',
        icon: options.acceptIcon,
      },
      rejectButtonProps: {
        severity: 'secondary',
        icon: 'pi pi-interdiction',
        outlined: true,
      },
    });
  }

  dangerDecision(event: PopupTargetEvent, options: DecisionPopupOptions): void {
    void this.confirm(event, {
      message: options.message,
      icon: options.icon ?? 'pi pi-exclamation-triangle',
      accept: options.accept ?? (() => {}),
      reject: options.reject ?? (() => {}),
      acceptLabel: options.acceptLabel,
      rejectLabel: options.rejectLabel,
      acceptButtonProps: {
        severity: 'danger',
        icon: options.acceptIcon,
      },
      rejectButtonProps: {
        severity: 'secondary',
        icon: 'pi pi-interdiction',
        outlined: true,
      },
    });
  }

  private async confirm(
    event: PopupTargetEvent,
    config: Record<string, unknown>,
  ): Promise<boolean> {
    const target = event.currentTarget;
    if (!target) return false;

    await this.ensureHost();

    if (!this.hostReady || ('isConnected' in target && target.isConnected !== true)) return false;

    this.confirmation.confirm({
      ...config,
      target,
    });
    return true;
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
