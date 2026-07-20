import { Component, computed, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { COWORKER_DOCUMENT_REVIEW_LIMITS } from '../../../../core/configs/coworker-documents.config';
import {
  ADMIN_SIGNATURE_VERIFICATION_STATUSES,
  AdminSignatureVerificationForm,
  AdminSignatureVerificationInput,
  AdminSignatureVerificationStatus,
} from '../../../../core/types/admin-coworker-document';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-admin-signature-verification-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    SelectModule,
    TextareaModule,
    ContextHelp,
  ],
  templateUrl: './signature-verification-editor.html',
})
export class SignatureVerificationEditor {
  private readonly formBuilder = inject(FormBuilder);

  readonly disabled = input(false);
  readonly busy = input(false);
  readonly verificationRequested =
    output<AdminSignatureVerificationInput>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly limits = COWORKER_DOCUMENT_REVIEW_LIMITS;
  protected readonly form: AdminSignatureVerificationForm =
    this.formBuilder.group({
      verificationStatus:
        new FormControl<AdminSignatureVerificationStatus | null>(
          null,
          { validators: Validators.required },
        ),
      reason: new FormControl('', {
        nonNullable: true,
        validators: Validators.maxLength(this.limits.signatureReasonLength),
      }),
    });
  protected readonly statusOptions = computed(() =>
    ADMIN_SIGNATURE_VERIFICATION_STATUSES.map((value) => ({
      value,
      label: this.i18n.review().options.signatureVerificationStatuses[value],
    })),
  );

  constructor() {
    effect(() => setControlEnabled(this.form, !this.disabled() && !this.busy()));
    this.form.controls.verificationStatus.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((status) => this.handleStatusChange(status));
    this.updateReasonValidators(null);
  }

  protected submit(): void {
    if (this.disabled() || this.busy() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (value.verificationStatus === null) return;

    this.verificationRequested.emit({
      verificationStatus: value.verificationStatus,
      reason: normalizeText(value.reason),
    });
  }

  private handleStatusChange(
    status: AdminSignatureVerificationStatus | null,
  ): void {
    if (status === 'confirmed') {
      this.form.controls.reason.setValue('', { emitEvent: false });
    }
    this.updateReasonValidators(status);
  }

  private updateReasonValidators(
    status: AdminSignatureVerificationStatus | null,
  ): void {
    const validators = [Validators.maxLength(this.limits.signatureReasonLength)];
    if (status !== null && status !== 'confirmed') {
      validators.push(Validators.required, requiredTrimmedValidator());
    }
    this.form.controls.reason.setValidators(validators);
    this.form.controls.reason.updateValueAndValidity({ emitEvent: false });
  }
}
