import {
  Component,
  input,
  output,
} from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';
import type { SessionDetailsData } from '../../../core/interfaces/i-session';
import type { IEventSlotCardVm } from '../../../core/interfaces/i-event-slot-card';
import { resolveLanguageFlagClass } from '../../../core/utils/language';
import { SessionDetails } from '../../../common/session-details/session-details';
import { createSessionDialogI18n } from './session-dialog.i18n';

@Component({
  selector: 'app-session-dialog',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    SessionDetails,
  ],
  templateUrl: './session-dialog.html',
  styleUrl: './session-dialog.scss',
  providers: [provideTranslocoScope('common')],
})
export class SessionDialog {
  readonly visible = input(false);
  readonly session = input<SessionDetailsData | null>(null);
  readonly eventCapacity = input<IEventSlotCardVm['eventCapacity']>();
  readonly gmDisplayName = input<string | null>(null);

  readonly visibleChange = output<boolean>();

  readonly i18n = createSessionDialogI18n();

  readonly resolveLanguageFlagClass = resolveLanguageFlagClass;
}
