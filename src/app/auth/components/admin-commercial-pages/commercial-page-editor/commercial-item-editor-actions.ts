import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-item-editor-actions',
  imports: [ButtonModule],
  templateUrl: './commercial-item-editor-actions.html',
})
export class CommercialItemEditorActions {
  readonly index = input.required<number>();
  readonly itemCount = input.required<number>();
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly remove = output<void>();

  protected readonly i18n = createAdminCommercialPagesI18n();
}
