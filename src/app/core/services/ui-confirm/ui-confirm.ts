import { inject, Injectable, signal, type TemplateRef } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import type { ButtonSeverity } from 'primeng/types/button';
import { asapScheduler, defer, Observable, observeOn, of } from 'rxjs';
import type {
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
  private hostLoader: (() => Observable<void>) | null = null;
  private hostReady = false;
  private modalResult: ((accepted: boolean) => void) | null = null;
  private closeModalHost: (() => void) | null = null;
  private readonly template = signal<TemplateRef<unknown> | null>(null);
  readonly modalTemplate = this.template.asReadonly();
  readonly modalDecisionKey = 'ui-modal-decision';

  registerHostLoader(loader: () => Observable<void>): void {
    this.hostLoader = loader;
  }

  markHostReady(): void {
    this.hostReady = true;
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
    // PrimeNG emits the decision before hide() finishes; notify callers after its onHide and cleanup.
    return new Observable<boolean>((subscriber) => {
      if (this.modalResult) {
        subscriber.next(false);
        subscriber.complete();
        return;
      }
      const finish = (accepted: boolean): void => {
        if (this.modalResult === finish) {
          this.modalResult = null;
          this.template.set(null);
        }
        subscriber.next(accepted);
        subscriber.complete();
      };
      this.modalResult = finish;
      const loading = this.ensureHost().subscribe({ next: () => {
        if (subscriber.closed) return;
        if (!this.hostReady || !this.closeModalHost) {
          finish(false);
          return;
        }
        const { messageTemplate, acceptSeverity, ...confirmationOptions } = options;
        this.template.set(messageTemplate ?? null);
        this.confirmation.confirm({
          ...confirmationOptions,
          key: this.modalDecisionKey,
          acceptIcon: options.acceptIcon,
          closable: true,
          closeOnEscape: true,
          dismissableMask: true,
          defaultFocus: 'reject',
          accept: () => finish(true),
          reject: () => finish(false),
          acceptButtonProps: { severity: acceptSeverity, icon: options.acceptIcon },
          rejectButtonProps: { severity: 'secondary', outlined: true },
        });
      }, error: () => finish(false) });
      return () => {
        loading.unsubscribe();
        if (this.modalResult !== finish) return;
        this.modalResult = null;
        this.template.set(null);
        this.closeModalHost?.();
      };
    }).pipe(observeOn(asapScheduler));
  }

  info(event: PopupTargetEvent, options: BasePopupOptions): void {
    this.confirm(event, options, 'info');
  }

  warn(event: PopupTargetEvent, options: BasePopupOptions): void {
    this.confirm(event, options, 'warn');
  }

  danger(event: PopupTargetEvent, options: BasePopupOptions): void {
    this.confirm(event, options, 'danger');
  }

  decision(event: PopupTargetEvent, options: DecisionPopupOptions): void {
    this.confirm(event, options, options.acceptSeverity);
  }

  dangerDecision(event: PopupTargetEvent, options: DecisionPopupOptions): void {
    this.confirm(event, options, options.acceptSeverity ?? 'danger');
  }

  private confirm(
    event: PopupTargetEvent,
    options: BasePopupOptions | DecisionPopupOptions,
    severity: ButtonSeverity,
  ): void {
    const target = event.currentTarget;
    if (!target) return;

    this.ensureHost().subscribe(() => {
      if (!this.hostReady || ('isConnected' in target && target.isConnected !== true)) return;
      const decision = 'rejectLabel' in options ? options : null;
      this.confirmation.confirm({
        target, message: options.message, icon: options.icon, acceptIcon: options.acceptIcon,
        accept: options.accept ?? (() => {}), reject: decision?.reject ?? (() => {}),
        acceptLabel: options.acceptLabel, rejectLabel: decision?.rejectLabel,
        rejectVisible: decision !== null,
        acceptButtonProps: { severity, icon: options.acceptIcon },
        rejectButtonProps: { severity: 'secondary', outlined: true },
      });
    });
  }

  private ensureHost(): Observable<void> {
    return defer(() => this.hostReady || !this.hostLoader ? of(undefined) : this.hostLoader());
  }
}
