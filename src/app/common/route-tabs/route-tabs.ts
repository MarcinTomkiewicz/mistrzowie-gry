import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import { createCommonAccessibilityI18n } from '../../core/translations/common.i18n';
import type { RouteTabDefinition } from '../../core/types/route-tab';

@Component({
  selector: 'app-route-tabs',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SelectModule, TabsModule],
  templateUrl: './route-tabs.html',
  providers: [provideTranslocoScope('common')],
})
export class RouteTabs {
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(
        (event): event is NavigationEnd => event instanceof NavigationEnd,
      ),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly tabs = input.required<readonly RouteTabDefinition[]>();
  readonly activeTabChange = output<RouteTabDefinition>();

  protected readonly accessibility = createCommonAccessibilityI18n();
  protected readonly selectOptions = computed(() => [...this.tabs()]);
  protected readonly activePathControl = new FormControl<string | null>(null);
  protected readonly activeTab = computed(
    () =>
      this.tabs().find((tab) => this.matchesCurrentUrl(tab.path)) ?? null,
  );

  constructor() {
    effect(() => {
      const activeTab = this.activeTab();
      const activePath = activeTab?.path ?? null;

      if (this.activePathControl.value !== activePath) {
        this.activePathControl.setValue(activePath, { emitEvent: false });
      }

      if (activeTab) {
        this.activeTabChange.emit(activeTab);
      }
    });
  }

  protected onActivePathChange(path: string | null): void {
    if (path) {
      void this.router.navigateByUrl(path);
    }
  }

  private matchesCurrentUrl(path: string): boolean {
    const currentPath = this.currentUrl().split(/[?#]/, 1)[0];

    return currentPath === path || currentPath.startsWith(`${path}/`);
  }
}
