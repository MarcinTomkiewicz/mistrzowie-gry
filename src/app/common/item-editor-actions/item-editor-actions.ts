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
  readonly disabled = input(false);
  readonly compact = input(false);
  readonly copyable = input(false);
  readonly removeIcon = input('pi pi-trash');
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly copyItem = output<void>();
  readonly remove = output<void>();

  protected readonly actions = createCommonActionsI18n();
}
