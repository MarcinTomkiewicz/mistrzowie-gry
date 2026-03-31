import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { RichContentInput } from '../../../core/types/rich-content';
import { RichContent } from '../rich-content/rich-content';

@Component({
  selector: 'app-legal-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, RichContent],
  templateUrl: './legal-dialog.html',
  styleUrl: './legal-dialog.scss',
})
export class LegalDialog {
  readonly visible = input(false);
  readonly dialogTitle = input('');
  readonly dialogSubtitle = input('');
  readonly dialogContent = input<RichContentInput>(null);
  readonly closeLabel = input('Zamknij');

  readonly visibleChange = output<boolean>();

  protected close(): void {
    this.visibleChange.emit(false);
  }
}
