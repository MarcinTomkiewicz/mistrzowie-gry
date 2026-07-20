import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';

import { COWORKER_OPERATIONAL_DOCUMENT_LIMITS } from '../../../../../core/configs/coworker-operational-documents.config';
import { canPerformCoworkerOperationalAction } from '../../../../../core/domain/coworker-operational-documents/assignments';
import { ICoworkerOperationalAssignment } from '../../../../../core/interfaces/i-coworker-operational-document';
import {
  COWORKER_OPERATIONAL_EDGE_ACTION,
  CoworkerOperationalAction,
  CoworkerOperationalActionForm,
  RecordCoworkerOperationalActionRequest,
} from '../../../../../core/types/coworker-operational-document';
import { EdgeFunctionError } from '../../../../../core/types/edge-function-error';
import { setControlEnabled } from '../../../../../core/utils/form-controls';
import { normalizeText } from '../../../../../core/utils/normalize-text';
import { requiredTrimmedValidator } from '../../../../../core/validators/required-trimmed.validator';
import { ContextHelp } from '../../../../../public/common/context-help/context-help';
import { createOperationalDocumentsI18n } from '../operational-documents.i18n';

@Component({
  selector: 'app-operational-action-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    IftaLabelModule,
    TextareaModule,
    ContextHelp,
  ],
  templateUrl: './operational-action-dialog.html',
})
export class OperationalActionDialog {
  private readonly formBuilder = inject(FormBuilder);

  readonly assignment = input.required<ICoworkerOperationalAssignment>();
  readonly action = input.required<CoworkerOperationalAction>();
  readonly busy = input(false);
  readonly error = input<EdgeFunctionError | null>(null);
  readonly errorDescription = input('');

  readonly closeRequested = output<void>();
  readonly actionRequested =
    output<RecordCoworkerOperationalActionRequest>();

  protected readonly i18n = createOperationalDocumentsI18n();
  protected readonly limits = COWORKER_OPERATIONAL_DOCUMENT_LIMITS;
  protected readonly statement = computed(() =>
    this.assignment().statements.find(
      (statement) => statement.action === this.action(),
    ) ?? null,
  );
  protected readonly actionAvailable = computed(() =>
    canPerformCoworkerOperationalAction(this.assignment(), this.action()),
  );
  protected readonly form: CoworkerOperationalActionForm =
    this.formBuilder.nonNullable.group({
      declineReason: [
        '',
        Validators.maxLength(this.limits.declineReasonLength),
      ],
    });

  constructor() {
    effect(() => {
      setControlEnabled(this.form, !this.busy());
      const validators = [
        Validators.maxLength(this.limits.declineReasonLength),
      ];
      if (this.action() === 'declined') {
        validators.push(Validators.required, requiredTrimmedValidator());
      }
      this.form.controls.declineReason.setValidators(validators);
      this.form.controls.declineReason.updateValueAndValidity({
        emitEvent: false,
      });
    });
  }

  protected submit(): void {
    if (!this.actionAvailable() || this.busy() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const assignmentId = this.assignment().id;
    const action = this.action();
    if (action === 'declined') {
      const declineReason = normalizeText(this.form.controls.declineReason.value);
      if (declineReason === null) {
        this.form.controls.declineReason.markAsTouched();
        return;
      }
      this.actionRequested.emit({
        action: COWORKER_OPERATIONAL_EDGE_ACTION.recordAction,
        assignmentId,
        documentAction: action,
        declineReason,
      });
      return;
    }

    this.actionRequested.emit({
      action: COWORKER_OPERATIONAL_EDGE_ACTION.recordAction,
      assignmentId,
      documentAction: action,
      declineReason: null,
    });
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible && !this.busy()) this.closeRequested.emit();
  }
}
