import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';

import { COWORKER_DOCUMENT_REVIEW_LIMITS } from '../../../../core/configs/coworker-documents.config';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import {
  AdminCoworkerAcceptDocumentInput,
  AdminCoworkerRejectDocumentInput,
  AdminCoworkerReviewDecisionForm,
} from '../../../../core/types/admin-coworker-document';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-admin-review-decision-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    TextareaModule,
    ContextHelp,
  ],
  templateUrl: './review-decision-editor.html',
})
export class ReviewDecisionEditor {
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirm = inject(UiConfirm);

  readonly disabled = input(false);
  readonly acceptBusy = input(false);
  readonly rejectBusy = input(false);
  readonly acceptRequested = output<AdminCoworkerAcceptDocumentInput>();
  readonly rejectRequested = output<AdminCoworkerRejectDocumentInput>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly limits = COWORKER_DOCUMENT_REVIEW_LIMITS;
  protected readonly form: AdminCoworkerReviewDecisionForm =
    this.formBuilder.nonNullable.group({
      rejectionReason: [
        '',
        [
          Validators.required,
          requiredTrimmedValidator(),
          Validators.maxLength(this.limits.rejectionReasonLength),
        ],
      ],
      note: ['', Validators.maxLength(this.limits.noteLength)],
    });

  constructor() {
    effect(() => {
      setControlEnabled(
        this.form,
        !this.disabled() && !this.acceptBusy() && !this.rejectBusy(),
      );
    });
  }

  protected confirmAccept(event: Event): void {
    if (
      this.disabled() ||
      this.acceptBusy() ||
      this.rejectBusy() ||
      this.form.controls.note.invalid
    ) {
      this.form.controls.note.markAsTouched();
      return;
    }
    const input = {
      note: normalizeText(this.form.controls.note.value),
    };
    this.confirm.decision(event, {
      message: this.i18n.review().messages.acceptConfirmation,
      acceptLabel: this.i18n.review().actions.acceptDocument,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.acceptRequested.emit(input),
    });
  }

  protected confirmReject(event: Event): void {
    if (
      this.disabled() ||
      this.acceptBusy() ||
      this.rejectBusy() ||
      this.form.invalid
    ) {
      this.form.markAllAsTouched();
      return;
    }
    const input = {
      rejectionReason: this.form.controls.rejectionReason.value.trim(),
      note: normalizeText(this.form.controls.note.value),
    };
    this.confirm.decision(event, {
      message: this.i18n.review().messages.rejectConfirmation,
      acceptLabel: this.i18n.review().actions.rejectDocument,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.rejectRequested.emit(input),
    });
  }
}
