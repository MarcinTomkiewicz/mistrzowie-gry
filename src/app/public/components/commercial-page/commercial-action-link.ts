import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import type { CommercialAction } from '../../../core/types/commercial-page';

@Component({
  selector: 'app-commercial-action-link',
  imports: [RouterLink, ButtonModule],
  template: `
    <p-button
      [label]="action().label"
      [routerLink]="action().route"
      [severity]="action().appearance"
    />
  `,
})
export class CommercialActionLink {
  readonly action = input.required<CommercialAction>();
}
