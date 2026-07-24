import { Component, effect, inject, input } from '@angular/core';

import { Seo } from '../../../core/services/seo/seo';
import type { RouteTabDefinition } from '../../../core/types/route-tab';
import { RouteTabs } from '../../../public/common/route-tabs/route-tabs';

@Component({
  selector: 'app-route-tab-shell',
  standalone: true,
  imports: [RouteTabs],
  templateUrl: './route-tab-shell.html',
})
export class RouteTabShell {
  private readonly seo = inject(Seo);

  readonly heading = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly seoTitle = input.required<string>();
  readonly seoDescription = input.required<string>();
  readonly canonicalUrl = input.required<string>();
  readonly tabs = input.required<readonly RouteTabDefinition[]>();

  constructor() {
    effect(() => {
      this.applySeo(this.seoTitle());
    });
  }

  protected onActiveTabChange(tab: RouteTabDefinition): void {
    this.applySeo(`${this.seoTitle()} — ${tab.label}`);
  }

  private applySeo(title: string): void {
    this.seo.apply({
      title,
      description: this.seoDescription(),
      canonicalUrl: this.canonicalUrl(),
      robots: 'noindex,nofollow',
    });
  }
}
