import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-info-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './info-dialog.html',
  styleUrl: './info-dialog.scss',
})
export class InfoDialog {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() title = '';
  @Input() subtitle = '';
  @Input() body = '';

  @Input() styleClass = 'mg-dialog mg-dialog--info';
  @Input() width = '40rem';
  @Input() modal = true;
  @Input() dismissableMask = true;
  @Input() closable = true;
  @Input() closeLabel = 'Zamknij';
  @Input() showFooter = true;

  readonly breakpoints = {
    '960px': '75vw',
    '640px': '94vw',
  };

  onVisibleChange(next: boolean): void {
    this.visible = next;
    this.visibleChange.emit(next);
  }

  close(): void {
    this.onVisibleChange(false);
  }
}