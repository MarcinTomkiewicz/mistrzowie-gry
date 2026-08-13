import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { createCommonActionsI18n } from '../../core/translations/common.i18n';

@Component({
  selector: 'app-item-editor-actions',
  imports: [ButtonModule],
  templateUrl: './item-editor-actions.html',
})
export class ItemEditorActions {
  readonly index = input.required<number>();
  readonly itemCount = input.required<number>();
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly remove = output<void>();

  protected readonly actions = createCommonActionsI18n();
}
