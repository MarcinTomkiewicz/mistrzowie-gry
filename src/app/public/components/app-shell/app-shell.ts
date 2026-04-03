import {
  Component,
  ComponentRef,
  Type,
  inject,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { LazyMountHost } from '../../../core/directives/lazy-mount-host/lazy-mount-host';
import { LazyComponentLoader } from '../../../core/services/lazy-component-loader/lazy-component-loader';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { ToastHost } from './toast-host';

@Component({
  selector: 'app-app-shell',
  imports: [RouterOutlet, LazyMountHost, Navbar, Footer, ToastHost],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly lazyComponentLoader = inject(LazyComponentLoader);
  private readonly uiConfirm = inject(UiConfirm);
  private readonly confirmPopupHost = viewChild(LazyMountHost);
  private readonly loadConfirmPopupHost = () =>
    import('../../common/confirm-popup-host/confirm-popup-host').then(
      ({ ConfirmPopupHost }) => ConfirmPopupHost as Type<object>,
    );
  private confirmPopupRef: ComponentRef<object> | null = null;
  private confirmPopupMountPromise: Promise<void> | null = null;

  constructor() {
    this.uiConfirm.registerHostLoader(() => this.ensureConfirmPopupMounted());
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
}
