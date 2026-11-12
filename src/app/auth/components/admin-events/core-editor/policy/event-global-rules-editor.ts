import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ContextHelp } from '../../../../../common/context-help/context-help';
import { ParticipantSignupKind } from '../../../../../core/enums/event';
import { EventSignupFields } from '../../event-signup-fields/event-signup-fields';
import { createEventCoreEditorI18n } from '../core-editor.i18n';
import { EventGlobalPolicyFacade } from './event-global-policy-facade';
import type { AdminGlobalEventPageFieldError } from '../../../../../core/interfaces/i-admin-global-event-preview';
import { EventGlobalDiagnosticMessages, selectEventGlobalDiagnosticIssues } from '../event-global-diagnostic-messages';

@Component({
  selector: 'app-event-global-rules-editor',
  imports: [NgTemplateOutlet, ReactiveFormsModule, InputNumberModule, ToggleSwitchModule, EventSignupFields, ContextHelp, EventGlobalDiagnosticMessages],
  templateUrl: './event-global-rules-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalRulesEditor {
  readonly fieldErrors = input<readonly AdminGlobalEventPageFieldError[]>([]);
  protected readonly editor = inject(EventGlobalPolicyFacade);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.policyEditor;
  protected readonly signupKinds = ParticipantSignupKind;
  protected get form() { return this.editor.form.controls.rules; }

  protected showCityOverrides(): boolean {
    return this.fieldErrors().some(issue => issue.field === 'cityOverrides') || this.form.controls.cityOverrides.length > 1 || this.form.controls.cityOverrides.controls.some(row =>
      row.controls.signup.controls.enabled.value || row.controls.sessionCapacityCeiling.controls.enabled.value ||
      row.controls.wholeEventCapacity.controls.enabled.value) || this.editor.sourceDocument()?.cityOverrides.some(row =>
      Object.values(row.overrides).some(group => group.enabled)) === true;
  }

  protected cityName(editionId: string): string | undefined {
    return this.editor.draft()?.canonicalBaseline.editions.find(edition => edition.editionId === editionId)?.city;
  }

  protected cityIssues(editionId: string) {
    return selectEventGlobalDiagnosticIssues(this.fieldErrors(), ['cityOverrides'], editionId);
  }
}
