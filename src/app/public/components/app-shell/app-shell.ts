import {
  Component,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { catchError, map, Observable, of, shareReplay, switchMap, throwError } from 'rxjs';

import { LazyMountHost } from '../../../core/directives/lazy-mount-host/lazy-mount-host';
import { LEGAL_DIALOGS } from '../../../core/configs/legal-dialogs.config';
import { LegalDialogs } from '../../../core/services/legal-dialogs/legal-dialogs';
import { LazyComponentLoader } from '../../../core/services/lazy-component-loader/lazy-component-loader';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { LegalDialog } from '../../common/legal-dialog/legal-dialog';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-app-shell',
  imports: [RouterOutlet, TranslocoPipe, LazyMountHost, Navbar, Footer, LegalDialog],
  providers: [provideTranslocoScope('common')],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  protected readonly legalDialogs = inject(LegalDialogs);
  protected readonly commonActions = createCommonActionsI18n();
  protected readonly commonErrors = createCommonErrorsI18n();
  protected readonly commonStatus = createCommonStatusI18n();
  protected readonly legalDialogLabelKey = computed(() => {
    const dialog = this.legalDialogs.activeDialog();
    return dialog === null ? null : LEGAL_DIALOGS[dialog].labelKey;
  });
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
      ({ ConfirmPopupHost }) => ConfirmPopupHost,
    );
  private readonly loadToastHost = () =>
    import('./toast-host').then(
      ({ ToastHost }) => ToastHost,
    );
  private confirmPopupMount: Observable<void> | null = null;
  private toastMount: Observable<void> | null = null;

  constructor() {
    this.uiConfirm.registerHostLoader(() => this.ensureConfirmPopupMounted());
    this.uiToast.registerHostLoader(() => this.ensureToastMounted());
  }

  private ensureConfirmPopupMounted(): Observable<void> {
    if (this.confirmPopupMount) return this.confirmPopupMount;
    const host = this.confirmPopupHost()?.viewContainerRef;
    if (!host) return of(undefined);

    this.confirmPopupMount = this.lazyComponentLoader.mount({
      host,
      load: this.loadConfirmPopupHost,
      onMount: componentRef => {
        componentRef.changeDetectorRef.detectChanges();
        this.uiConfirm.markHostReady();
      },
    }).pipe(
      map(() => undefined),
      catchError((error: unknown) => {
        this.confirmPopupMount = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.confirmPopupMount;
  }

  private ensureToastMounted(): Observable<void> {
    if (this.toastMount) return this.toastMount;
    const host = this.toastHost()?.viewContainerRef;
    if (!host) return of(undefined);

    this.toastMount = this.lazyComponentLoader.mount({ host, load: this.loadToastHost }).pipe(
      switchMap(componentRef => new Observable<void>(subscriber => {
        const ready = componentRef.instance.ready.subscribe(() => {
          this.uiToast.markHostReady();
          subscriber.next();
          subscriber.complete();
        });
        componentRef.changeDetectorRef.detectChanges();
        return () => ready.unsubscribe();
      })),
      catchError((error: unknown) => {
        this.toastMount = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.toastMount;
  }
}
