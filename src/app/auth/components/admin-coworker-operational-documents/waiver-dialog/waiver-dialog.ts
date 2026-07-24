import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';

import { ADMIN_OPERATIONAL_ASSIGNMENT_LIMITS } from '../../../../core/configs/admin-coworker-operational-documents.config';
import type { IAdminOperationalAssignmentListItem } from '../../../../core/interfaces/i-admin-operational-assignment';
import type { AdminOperationalWaiverForm } from '../../../../core/types/admin-operational-forms';
import type { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import { formatAdminOperationalCoworkerLabel } from '../operational-labels';

@Component({
  selector: 'app-admin-operational-waiver-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    IftaLabelModule,
    TextareaModule,
  ],
  templateUrl: './waiver-dialog.html',
})
export class WaiverDialog {
  private readonly formBuilder = inject(FormBuilder);

  readonly item = input.required<IAdminOperationalAssignmentListItem>();
  readonly busy = input(false);
  readonly error = input<EdgeFunctionError | null>(null);
  readonly errorDescription = input('');
  readonly closeRequested = output<void>();
  readonly waiverRequested = output<string>();

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly limits = ADMIN_OPERATIONAL_ASSIGNMENT_LIMITS;
  protected readonly formatCoworkerLabel =
    formatAdminOperationalCoworkerLabel;
  protected readonly form: AdminOperationalWaiverForm =
    this.formBuilder.nonNullable.group({
      reason: [
        '',
        [
          requiredTrimmedValidator(),
          Validators.maxLength(this.limits.waiverReasonLength),
        ],
      ],
    });

  constructor() {
    effect(() => setControlEnabled(this.form, !this.busy()));
  }

  protected submit(): void {
    if (this.busy() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const reason = normalizeText(this.form.controls.reason.value);
    if (reason === null) {
      this.form.controls.reason.markAsTouched();
      return;
    }
    this.waiverRequested.emit(reason);
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible && !this.busy()) this.closeRequested.emit();
  }
}
