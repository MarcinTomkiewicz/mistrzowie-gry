import {
  Component,
  ComponentRef,
  OutputEmitterRef,
  Type,
  inject,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { LazyMountHost } from '../../../core/directives/lazy-mount-host/lazy-mount-host';
import { LazyComponentLoader } from '../../../core/services/lazy-component-loader/lazy-component-loader';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';

interface LazyToastHostComponent {
  ready: OutputEmitterRef<void>;
}

@Component({
  selector: 'app-app-shell',
  imports: [RouterOutlet, LazyMountHost, Navbar, Footer],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly lazyComponentLoader = inject(LazyComponentLoader);
  private readonly uiConfirm = inject(UiConfirm);
  private readonly uiToast = inject(UiToast);
  private readonly confirmPopupHost = viewChild('confirmPopupHost', {
    read: LazyMountHost,
  });
  private readonly toastHost = viewChild('toastHost', {
    read: LazyMountHost,
  });
  private readonly loadConfirmPopupHost = () =>
    import('../../common/confirm-popup-host/confirm-popup-host').then(
      ({ ConfirmPopupHost }) => ConfirmPopupHost as Type<object>,
    );
  private readonly loadToastHost = () =>
    import('./toast-host').then(
      ({ ToastHost }) => ToastHost as Type<LazyToastHostComponent>,
    );
  private confirmPopupRef: ComponentRef<object> | null = null;
  private confirmPopupMountPromise: Promise<void> | null = null;
  private toastRef: ComponentRef<LazyToastHostComponent> | null = null;
  private toastMountPromise: Promise<void> | null = null;

  constructor() {
    this.uiConfirm.registerHostLoader(() => this.ensureConfirmPopupMounted());
    this.uiToast.registerHostLoader(() => this.ensureToastMounted());
  }

  private ensureConfirmPopupMounted(): Promise<void> {
    if (this.confirmPopupRef) {
      return Promise.resolve();
    }

    if (this.confirmPopupMountPromise) {
      return this.confirmPopupMountPromise;
    }

    const host = this.confirmPopupHost()?.viewContainerRef;
    if (!host) {
      return Promise.resolve();
    }

    this.confirmPopupMountPromise = firstValueFrom(
      this.lazyComponentLoader.mount({
        host,
        load: this.loadConfirmPopupHost,
        onMount: (componentRef) => {
          this.confirmPopupRef = componentRef;
          this.uiConfirm.markHostReady();
        },
      }),
    )
      .then(() => undefined)
      .finally(() => {
        if (!this.confirmPopupRef) {
          this.confirmPopupMountPromise = null;
        }
      });

    return this.confirmPopupMountPromise;
  }

  private ensureToastMounted(): Promise<void> {
    if (this.toastRef) {
      return Promise.resolve();
    }

    if (this.toastMountPromise) {
      return this.toastMountPromise;
    }

    const host = this.toastHost()?.viewContainerRef;
    if (!host) {
      return Promise.resolve();
    }

    this.toastMountPromise = new Promise<void>((resolve, reject) => {
      let readyHandled = false;

      firstValueFrom(
        this.lazyComponentLoader.mount({
          host,
          load: this.loadToastHost,
          onMount: (componentRef) => {
            this.toastRef = componentRef;
            componentRef.instance.ready.subscribe(() => {
              if (readyHandled) {
                return;
              }

              readyHandled = true;
              this.uiToast.markHostReady();
              resolve();
            });
          },
        }),
      ).catch(reject);
    })
      .finally(() => {
        if (!this.toastRef) {
          this.toastMountPromise = null;
        }
      });

    return this.toastMountPromise;
  }
}
