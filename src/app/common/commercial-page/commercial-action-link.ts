import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import type {
  CommercialButton,
} from '../../core/types/commercial-page-builder';

@Component({
  selector: 'app-commercial-action-link',
  imports: [RouterLink, ButtonModule],
  template: `
    <p-button
      [label]="action().label"
      [routerLink]="action().route"
      [severity]="action().appearance"
      [icon]="action().iconKey ? 'pi pi-' + action().iconKey : undefined"
    />
  `,
})
export class CommercialActionLink {
  readonly action = input.required<CommercialButton>();
}
