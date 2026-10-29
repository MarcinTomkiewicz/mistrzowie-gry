import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { createParticipantSignupKindOptions, resolveParticipantSignupKindLabel } from '../../participant-signup-kind-options';
import { createEventCoreEditorI18n } from '../core-editor.i18n';
import { EventGlobalPolicyFacade } from './event-global-policy-facade';

@Component({
  selector: 'app-event-global-rules-editor',
  imports: [NgTemplateOutlet, ReactiveFormsModule, FloatLabelModule, InputNumberModule, SelectModule, ToggleSwitchModule],
  templateUrl: './event-global-rules-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalRulesEditor {
  protected readonly editor = inject(EventGlobalPolicyFacade);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.policyEditor;
  protected readonly signupKinds = computed(() => createParticipantSignupKindOptions(this.i18n.participantKinds()));
  protected get form() { return this.editor.form.controls.rules; }

  protected get inheritedSignupKindLabel(): string {
    return resolveParticipantSignupKindLabel(this.form.controls.global.controls.participantSignupKind.value, this.i18n.participantKinds());
  }

  protected cityName(editionId: string): string | undefined {
    return this.editor.draft()?.canonicalBaseline.editions.find(edition => edition.editionId === editionId)?.city;
  }
}
