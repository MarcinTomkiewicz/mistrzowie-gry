import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { STATUS_BADGE_CLASS } from '../../../core/configs/badge-class.config';
import {
  GM_STAFFING_HUB_ROUTE,
  STAFFING_REALIZATION_HUB_SECTIONS,
} from '../../../core/configs/staffing-realization.config';
import type { MyStaffingRealizationHub } from '../../../core/interfaces/my-staffing-realization';
import { MyStaffingRealizationRead } from '../../../core/reads/staffing/my-staffing-realization-read';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { GM_STAFFING_SCOPE, STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import { formatDateLabel } from '../../../core/utils/date';
import { createGmStaffingHubI18n } from './gm-staffing-hub.i18n';

@Component({
  selector: 'app-gm-staffing-hub',
  imports: [RouterLink, ButtonModule, LoadingOverlay],
  templateUrl: './gm-staffing-hub.html',
  providers: [provideTranslocoScope(GM_STAFFING_SCOPE, STAFFING_SCOPE, 'common')],
})
export class GmStaffingHub {
  private readonly read = inject(MyStaffingRealizationRead);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hub = signal<MyStaffingRealizationHub | null>(null);

  protected readonly i18n = createGmStaffingHubI18n();
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly hubRoute = GM_STAFFING_HUB_ROUTE;
  protected readonly statusBadgeClass = STATUS_BADGE_CLASS;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly sections = computed(() => {
    const hub = this.hub();
    return hub
      ? STAFFING_REALIZATION_HUB_SECTIONS.map((key) => ({ key, items: hub[key] }))
      : [];
  });

  constructor() {
    this.loadHub();
  }

  protected loadHub(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.read.getHub().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (hub) => this.hub.set(hub),
      error: () => {
        this.hub.set(null);
        this.hasLoadError.set(true);
        this.toast.danger({
          summary: this.i18n.page().loadErrorTitle,
          detail: this.i18n.commonErrors().generic,
        });
      },
    });
  }
}
