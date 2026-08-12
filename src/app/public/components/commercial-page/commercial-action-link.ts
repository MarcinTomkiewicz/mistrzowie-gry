import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import {
  commercialIconClass,
} from '../../../core/configs/commercial-pages.config';
import type {
  CommercialButton,
} from '../../../core/types/commercial-page-builder';

@Component({
  selector: 'app-commercial-action-link',
  imports: [RouterLink, ButtonModule],
  template: `
    <p-button
      [label]="action().label"
      [routerLink]="action().route"
      [severity]="action().appearance"
      [icon]="iconClass()"
    />
  `,
})
export class CommercialActionLink {
  readonly action = input.required<CommercialButton>();

  protected iconClass(): string | undefined {
    const iconKey = this.action().iconKey;
    return iconKey ? commercialIconClass(iconKey) : undefined;
  }
}
