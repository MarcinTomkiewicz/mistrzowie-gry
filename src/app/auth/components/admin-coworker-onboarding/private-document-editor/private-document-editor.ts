import { Component, input, output, type OnChanges, type SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import type {
  IAdminCoworkerDocumentCategory,
  IAdminCoworkerOnboardingDocument,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { createCoworkerOnboardingI18n } from '../../../../core/translations/coworker-onboarding.i18n';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';

export type PrivateDocumentEditKind = 'reject' | 'reclassify';

@Component({
  selector: 'app-private-document-editor',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, IftaLabelModule, SelectModule, TextareaModule],
  templateUrl: './private-document-editor.html',
})
export class PrivateDocumentEditor implements OnChanges {
  readonly document = input.required<IAdminCoworkerOnboardingDocument>();
  readonly kind = input.required<PrivateDocumentEditKind>();
  readonly categories = input.required<IAdminCoworkerDocumentCategory[]>();
  readonly saving = input(false);
  readonly closed = output<void>();
  readonly submitted = output<string>();

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly rejectionReason = new FormControl('', {
    nonNullable: true,
    validators: [requiredTrimmedValidator(), Validators.maxLength(1000)],
  });
  protected readonly categoryKey = new FormControl<string | null>(null, Validators.required);
  protected readonly form = new FormGroup({
    rejectionReason: this.rejectionReason,
    categoryKey: this.categoryKey,
  });

  ngOnChanges(changes: SimpleChanges<PrivateDocumentEditor>): void {
    if (!changes.kind && !changes.document) return;

    const rejecting = this.kind() === 'reject';
    this.form.reset({
      rejectionReason: { value: '', disabled: !rejecting },
      categoryKey: { value: rejecting ? null : this.document().category, disabled: rejecting },
    });
  }

  protected canReclassify(): boolean {
    const key = this.categoryKey.value;
    return this.categoryKey.valid && key !== this.document().category &&
      this.categories().some((category) => category.category_key === key);
  }

  protected save(): void {
    if (this.saving()) return;
    if (this.kind() === 'reject') {
      this.rejectionReason.markAsTouched();
      if (this.rejectionReason.valid) this.submitted.emit(this.rejectionReason.value.trim());
    } else {
      const key = this.categoryKey.value;
      if (key !== null && this.canReclassify()) this.submitted.emit(key);
    }
  }
}
