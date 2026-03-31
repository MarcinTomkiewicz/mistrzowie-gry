import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { RichContentInput } from '../../../core/types/rich-content';
import { UiSemanticVariant, UiSize } from '../../../core/types/ui';
import { RichContent } from '../rich-content/rich-content';
import { createInfoDialogI18n } from './info-dialog.i18n';

@Component({
  selector: 'app-info-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, RichContent],
  templateUrl: './info-dialog.html',
  styleUrl: './info-dialog.scss',
})
export class InfoDialog {
  readonly visible = input(false);
  readonly title = input('');
  readonly subtitle = input('');
  readonly body = input('');
  readonly maximizable = input<boolean>(false);
  readonly content = input<RichContentInput>(null);
  readonly closeLabel = input<string | null>(null);
  readonly size = input<UiSize>('md');
  readonly variant = input<UiSemanticVariant>('base');

  readonly visibleChange = output<boolean>();

  protected readonly i18n = createInfoDialogI18n();

  protected readonly resolvedContent = computed<RichContentInput>(() => {
    const content = this.content();
    return content != null ? content : this.body();
  });

  protected readonly resolvedCloseLabel = computed(
    () => this.closeLabel() || this.i18n.actions().close,
  );

  protected readonly dialogStyleClass = computed(() => {
    const variant = this.variant();
    return variant === 'base'
      ? `mg-dialog mg-dialog--${this.size()}`
      : `mg-dialog mg-dialog--${variant} mg-dialog--${this.size()}`;
  });

  protected onVisibleChange(next: boolean): void {
    this.visibleChange.emit(next);
  }

  protected close(): void {
    this.visibleChange.emit(false);
  }
}
