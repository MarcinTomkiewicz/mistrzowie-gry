import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { SessionDetails } from '../../../../common/session-details/session-details';
import { getGmPublicProfileDisplayName } from '../../../../core/utils/user-display';
import { createEventAdminTimelineI18n } from '../event-admin-timeline/event-admin-timeline.i18n';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventManualProgramController } from './event-manual-program-controller';

@Component({
  selector: 'app-event-manual-rpg-editor',
  imports: [ReactiveFormsModule, ButtonModule, FloatLabelModule, InputNumberModule, InputTextModule, SelectModule, SessionDetails],
  templateUrl: './event-manual-rpg-editor.html',
})
export class EventManualRpgEditor {
  protected readonly editor = inject(EventManualProgramController);
  protected readonly i18n = createEventAdminTimelineI18n();
  protected readonly coreI18n = createEventCoreEditorI18n();
  protected readonly copy = computed(() => this.i18n.copy().manualRpg);
  private readonly value = toSignal(this.editor.rpgForm.valueChanges);
  protected readonly profiles = computed(() => this.editor.profiles().map(profile => ({
    value: profile.user.id, label: getGmPublicProfileDisplayName(profile),
  })));
  protected readonly sources = computed(() => [
    { value: 'template', label: this.copy().template }, { value: 'custom', label: this.copy().custom },
  ]);
  protected readonly sessions = computed(() => this.editor.catalog().map(session => ({ value: session.id, label: `${session.title} - ${session.system.name}` })));
  protected readonly selectedSession = computed(() => {
    this.value();
    return this.editor.catalog().find(session => session.id === this.editor.rpgForm.controls.sessionId.value) ?? null;
  });
}
