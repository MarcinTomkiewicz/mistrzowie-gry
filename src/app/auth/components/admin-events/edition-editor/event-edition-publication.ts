import { Component, DestroyRef, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import type { EventPublishResult, IAdminEventDetail, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { createEventEditionEditorI18n } from './edition-editor.i18n';

@Component({
  selector: 'app-event-edition-publication',
  imports: [RouterLink, ButtonModule, MessageModule],
  templateUrl: './event-edition-publication.html',
})
export class EventEditionPublication {
  readonly core = input.required<IEventCoreDetail>();
  readonly edition = input.required<IAdminEventDetail>();
  readonly result = input<EventPublishResult | null>(null);
  readonly canPublish = input(false);
  readonly busy = input(false);
  readonly publishing = input(false);
  readonly dirty = input(false);
  readonly privateDraftBlocked = input(false);
  readonly publicPath = input<string | null>(null);
  readonly publishRequested = output<void>();
  readonly refresh = output<void>();
  protected readonly i18n = createEventEditionEditorI18n();
  protected readonly formatTimestampLabel = formatTimestampLabel;
  private readonly confirm = inject(UiConfirm);
  private readonly destroyRef = inject(DestroyRef);

  protected confirmPublication(event: Event): void {
    if (!this.canPublish()) return;
    const coreId = this.core().id;
    const eventId = this.edition().id;
    const copy = this.i18n.publication();
    this.confirm.decision(event, {
      message: this.edition().isStaffingReleased ? copy.repeatConfirm : copy.confirm,
      acceptLabel: copy.publish,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (!this.destroyRef.destroyed && coreId === this.core().id && eventId === this.edition().id && this.canPublish()) {
          this.publishRequested.emit();
        }
      },
    });
  }
}
