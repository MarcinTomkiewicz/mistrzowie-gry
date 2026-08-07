import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { catchError, filter, of, startWith, switchMap } from 'rxjs';

import { buildSiteUrl } from '../../../../core/config/site';
import { CoworkerOnboarding } from '../../../../core/services/coworker-onboarding/coworker-onboarding';
import type { RouteTabDefinition } from '../../../../core/types/route-tab';
import { RouteTabShell } from '../../../common/route-tab-shell/route-tab-shell';
import {
  COWORKER_SHELL_SCOPE,
  createCoworkerShellI18n,
} from './coworker-shell.i18n';

@Component({
  selector: 'app-coworker-shell',
  standalone: true,
  imports: [RouterOutlet, RouteTabShell],
  templateUrl: './coworker-shell.html',
  providers: [provideTranslocoScope(COWORKER_SHELL_SCOPE)],
})
export class CoworkerShell {
  private readonly onboarding = inject(CoworkerOnboarding);
  private readonly router = inject(Router);
  private readonly portal = toSignal(
    this.router.events.pipe(
      filter(
        (event): event is NavigationEnd => event instanceof NavigationEnd,
      ),
      startWith(null),
      switchMap(() =>
        this.onboarding.getPortal().pipe(catchError(() => of(null))),
      ),
    ),
    { initialValue: null },
  );

  protected readonly pageUrl = buildSiteUrl('/auth/coworker');

  protected readonly i18n = createCoworkerShellI18n();

  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.tabs();
    const portal = this.portal();
    const tabs: RouteTabDefinition[] = [
      {
        id: 'questionnaire',
        label: labels.questionnaire,
        icon: 'pi pi-id-card',
        path: '/auth/coworker/questionnaire',
      },
    ];

    if (portal?.onboarding && portal.questionnaire_complete) {
      tabs.push({
        id: 'private-documents',
        label: labels.privateDocuments,
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
        label: labels.sharedDocuments,
        icon: 'pi pi-book',
        path: '/auth/coworker/shared-documents',
      });
    }

    return tabs;
  });

  constructor() {
    effect(() => {
      const portal = this.portal();

      if (!portal) return;

      const path = this.router.url.split(/[?#]/, 1)[0];
      const privateBlocked =
        path === '/auth/coworker/documents' &&
        (!portal.onboarding || !portal.questionnaire_complete);
      const sharedBlocked =
        path === '/auth/coworker/shared-documents' &&
        (!portal.questionnaire_complete ||
          portal.onboarding?.status !== 'completed');

      if (privateBlocked || sharedBlocked) {
        void this.router.navigateByUrl('/auth/coworker/questionnaire');
      }
    });
  }
}
