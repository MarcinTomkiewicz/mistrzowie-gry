import {
  Component,
  computed,
  effect,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { COWORKER_DOCUMENT_SHELL_LIMITS } from '../../../../core/configs/coworker-documents.config';
import type { IAdminOperationalDocumentDetail } from '../../../../core/interfaces/i-admin-operational-document';
import type { AdminOperationalDocumentFormSubmission } from '../../../../core/types/admin-operational-forms';
import type { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import {
  resolveEdgeFormFieldError,
  setControlEnabled,
} from '../../../../core/utils/form-controls';
import { CharacterCounter } from '../../../../public/common/character-counter/character-counter';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import {
  createAdminOperationalDocumentForm,
  mapAdminOperationalDocumentForm,
  populateAdminOperationalDocumentForm,
} from '../document-editor/document-form';

@Component({
  selector: 'app-admin-operational-document-shell-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    CharacterCounter,
    ContextHelp,
  ],
  templateUrl: './document-shell-form.html',
})
export class DocumentShellForm {
  readonly document = input<IAdminOperationalDocumentDetail | null>(null);
  readonly disabled = input(false);
  readonly saving = input(false);
  readonly archiving = input(false);
  readonly actionError = input<EdgeFunctionError | null>(null);
  readonly actionErrorDescription = input('');
  readonly reloadSuggested = input(false);
  readonly edited = output<void>();
  readonly dirtyChange = output<boolean>();
  readonly saveRequested =
    output<AdminOperationalDocumentFormSubmission>();
  readonly archiveRequested = output<Event>();
  readonly reloadRequested = output<void>();

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly limits = COWORKER_DOCUMENT_SHELL_LIMITS;
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly form = createAdminOperationalDocumentForm();
  protected readonly isArchived = computed(
    () => this.document()?.status === 'archived',
  );

  constructor() {
    effect(() => {
      populateAdminOperationalDocumentForm(this.form, this.document());
      this.dirtyChange.emit(false);
    });
    effect(() => setControlEnabled(this.form, !this.disabled()));
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.edited.emit();
        this.dirtyChange.emit(this.form.dirty);
      });
  }

  protected submit(): void {
    if (this.disabled() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const document = this.document();
    this.saveRequested.emit({
      document: mapAdminOperationalDocumentForm(
        this.form,
        document?.id ?? null,
      ),
      revision: document?.revision ?? null,
    });
  }

  protected fieldError(
    control: AbstractControl<unknown>,
    fieldPath: string,
  ): string | null {
    const serverError = resolveEdgeFormFieldError(
      control,
      fieldPath,
      this.actionError(),
      this.i18n.commonForm(),
    );
    if (
      fieldPath === 'document.code' &&
      control.touched &&
      control.hasError('pattern') &&
      !this.actionError()?.fieldErrors[fieldPath]
    ) {
      return this.i18n.validation().codePattern;
    }
    return serverError;
  }
}
