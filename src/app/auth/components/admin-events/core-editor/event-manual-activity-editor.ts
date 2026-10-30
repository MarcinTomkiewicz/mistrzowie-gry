import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { createCommonFormI18n } from '../../../../core/translations/common.i18n';
import { createEventAdminTimelineI18n } from '../event-admin-timeline/event-admin-timeline.i18n';
import { EventManualProgramController } from './event-manual-program-controller';

@Component({
  selector: 'app-event-manual-activity-editor',
  imports: [ReactiveFormsModule, ButtonModule, FloatLabelModule, InputNumberModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './event-manual-activity-editor.html',
})
export class EventManualActivityEditor {
  protected readonly editor = inject(EventManualProgramController);
  protected readonly i18n = createEventAdminTimelineI18n();
  protected readonly commonForm = createCommonFormI18n();
  protected readonly copy = computed(() => this.i18n.copy().manualActivity);
}
