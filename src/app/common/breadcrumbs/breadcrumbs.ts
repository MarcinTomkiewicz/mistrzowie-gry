import { Component, computed, input } from '@angular/core';

import type { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';

import type { BreadcrumbItem } from '../../core/types/breadcrumb';

@Component({
  selector: 'app-breadcrumbs',
  imports: [BreadcrumbModule],
  template: '<p-breadcrumb class="w-100" [model]="model()" />',
})
export class Breadcrumbs {
  readonly items = input.required<readonly BreadcrumbItem[]>();

  readonly model = computed<MenuItem[]>(() =>
    this.items().map((item) => ({
      label: item.label,
      routerLink: item.path,
    })),
  );
}
