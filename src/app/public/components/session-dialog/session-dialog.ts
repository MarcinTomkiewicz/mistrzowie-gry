import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ISessionWithRelations } from '../../../core/interfaces/i-session';
import { SessionDetails } from '../../common/session-details/session-details';
import { createSessionDialogI18n } from './session-dialog.i18n';

@Component({
  selector: 'app-session-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, SessionDetails],
  templateUrl: './session-dialog.html',
  styleUrl: './session-dialog.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class SessionDialog {
  readonly visible = input(false);
  readonly session = input<ISessionWithRelations | null>(null);

  readonly visibleChange = output<boolean>();

  readonly i18n = createSessionDialogI18n();

  readonly header = computed(() => this.session()?.title ?? '');

  onVisibleChange(next: boolean): void {
    this.visibleChange.emit(next);
  }

  close(): void {
    this.visibleChange.emit(false);
  }
}
