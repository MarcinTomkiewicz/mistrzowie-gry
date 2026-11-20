import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../../core/config/site';
import type { RouteTabDefinition } from '../../../../core/types/route-tab';
import { RouteTabShell } from '../../../common/route-tab-shell/route-tab-shell';
import {
  ADMIN_COWORKER_SHELL_SCOPE,
  createAdminCoworkerShellI18n,
} from './admin-coworker-shell.i18n';
import { OnboardingDetailTab } from './onboarding-detail-tab';

@Component({
  selector: 'app-admin-coworker-shell',
  standalone: true,
  imports: [RouterOutlet, RouteTabShell],
  templateUrl: './admin-coworker-shell.html',
  providers: [OnboardingDetailTab, provideTranslocoScope(ADMIN_COWORKER_SHELL_SCOPE, 'common')],
})
export class AdminCoworkerShell {
  private readonly detailTab = inject(OnboardingDetailTab);

  protected readonly pageUrl = buildSiteUrl('/admin/coworkers');
  protected readonly i18n = createAdminCoworkerShellI18n();

  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.tabs();
    const onboardingPath = '/admin/coworkers/onboarding';
    const detail = this.detailTab.current();
    const privateDocumentsLabel = this.i18n.commonNav().privateDocuments;

    return [
      {
        id: 'onboarding',
        label: labels.onboarding,
        icon: 'pi pi-uprising',
        path: onboardingPath,
      },
      ...(detail ? [{
        id: 'private-documents',
        label: privateDocumentsLabel && detail.name
          ? `${privateDocumentsLabel}: ${detail.name}`
          : privateDocumentsLabel,
        icon: 'pi pi-overlord',
        path: `${onboardingPath}/${encodeURIComponent(detail.id)}`,
      }] : []),
      {
        id: 'shared-documents',
        label: this.i18n.commonNav().sharedDocuments,
        icon: 'pi pi-stone-tablet',
        path: '/admin/coworkers/shared-documents',
      },
      {
        id: 'document-categories',
        label: labels.documentCategories,
        icon: 'pi pi-warehouse',
        path: '/admin/coworkers/document-categories',
      },
    ];
  });
}
