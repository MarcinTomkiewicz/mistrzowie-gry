import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import {
  catchError,
  filter,
  map,
  merge,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

import { buildSiteUrl } from '../../../../core/config/site';
import { CoworkerOnboarding } from '../../../../core/services/coworker-onboarding/coworker-onboarding';
import type { CoworkerPortalState } from '../../../../core/types/coworker-portal-state';
import type { RouteTabDefinition } from '../../../../core/types/route-tab';
import { RouteTabShell } from '../../../common/route-tab-shell/route-tab-shell';
import {
  COWORKER_SHELL_SCOPE,
  createCoworkerShellI18n,
} from './coworker-shell.i18n';

const INITIAL_PORTAL_STATE: CoworkerPortalState = { status: 'loading' };

@Component({
  selector: 'app-coworker-shell',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, RouteTabShell],
  templateUrl: './coworker-shell.html',
  providers: [provideTranslocoScope(COWORKER_SHELL_SCOPE, 'common')],
})
export class CoworkerShell {
  private readonly onboarding = inject(CoworkerOnboarding);
  private readonly router = inject(Router);
  private readonly portalReload$ = new Subject<void>();
  protected readonly portalState = toSignal(
    merge(
      this.router.events.pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      ),
      this.portalReload$,
    ).pipe(
      startWith(null),
      switchMap(() =>
        this.onboarding.getPortal().pipe(
          map(
            (portal): CoworkerPortalState => ({ status: 'loaded', portal }),
          ),
          catchError(() => of<CoworkerPortalState>({ status: 'error' })),
        ),
      ),
    ),
    { initialValue: INITIAL_PORTAL_STATE },
  );

  protected readonly pageUrl = buildSiteUrl('/auth/coworker');

  protected readonly i18n = createCoworkerShellI18n();

  private readonly privateDocumentsAvailable = computed(() => {
    const state = this.portalState();

    return (
      state.status === 'loaded' &&
      !!state.portal.onboarding &&
      state.portal.questionnaire_complete
    );
  });

  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.tabs();
    const state = this.portalState();
    const portal = state.status === 'loaded' ? state.portal : undefined;
    const tabs: RouteTabDefinition[] = [
      {
        id: 'questionnaire',
        label: labels.questionnaire,
        icon: 'pi pi-id-card',
        path: '/auth/coworker/questionnaire',
      },
    ];

    if (this.privateDocumentsAvailable()) {
      tabs.push({
        id: 'private-documents',
        label: this.i18n.commonNav().privateDocuments,
        icon: 'pi pi-lock',
        path: '/auth/coworker/documents',
      });
    }

    if (
      portal?.onboarding?.status === 'completed' &&
      portal.questionnaire_complete
    ) {
      tabs.push({
        id: 'shared-documents',
        label: this.i18n.commonNav().sharedDocuments,
        icon: 'pi pi-book',
        path: '/auth/coworker/shared-documents',
      });
    }

    return tabs;
  });

  constructor() {
    effect(() => {
      const state = this.portalState();

      if (state.status !== 'loaded') return;

      const path = this.router.url.split(/[?#]/, 1)[0];

      if (path !== '/auth/coworker' && path !== '/auth/coworker/') return;

      const target = this.privateDocumentsAvailable()
        ? '/auth/coworker/documents'
        : '/auth/coworker/questionnaire';

      void this.router.navigateByUrl(target, { replaceUrl: true });
    });
  }

  protected retryPortal(): void {
    this.portalReload$.next();
  }
}
