import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import type { RouteTabDefinition } from '../../core/types/route-tab';

@Component({
  selector: 'app-route-tabs',
  standalone: true,
  imports: [FormsModule, RouterLink, SelectModule, TabsModule],
  templateUrl: './route-tabs.html',
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

  protected readonly selectOptions = computed(() => [...this.tabs()]);
  protected readonly activeTab = computed(
    () =>
      this.tabs().find((tab) => this.matchesCurrentUrl(tab.path)) ?? null,
  );

  constructor() {
    effect(() => {
      const activeTab = this.activeTab();

      if (activeTab) {
        this.activeTabChange.emit(activeTab);
      }
    });
  }

  protected onMobileTabChange(path: string): void {
    void this.router.navigateByUrl(path);
  }

  private matchesCurrentUrl(path: string): boolean {
    const currentPath = this.currentUrl().split(/[?#]/, 1)[0];

    return currentPath === path || currentPath.startsWith(`${path}/`);
  }
}
