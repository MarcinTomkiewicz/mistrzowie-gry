import { HttpStatusCode } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';

import { COWORKER_DOCUMENT_DEFINITION_LIMITS } from '../../../../core/configs/coworker-documents.config';
import { IAdminCoworkerDocumentDefinition } from '../../../../core/interfaces/i-admin-coworker-document';
import { ICoworkerSignaturePolicy } from '../../../../core/interfaces/i-coworker-document';
import { AdminCoworkerDocuments } from '../../../../core/services/admin-coworker-documents/admin-coworker-documents';
import { AdminCoworkerDocumentArrayField } from '../../../../core/types/admin-coworker-document';
import {
  COWORKER_DOCUMENT_MULTIPLICITIES,
  COWORKER_DOCUMENT_ORIGIN_POLICIES,
} from '../../../../core/types/coworker-document';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import {
  isEdgeAccessError,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import {
  resolveEdgeFormFieldError,
  setControlEnabled,
} from '../../../../core/utils/form-controls';
import { CharacterCounter } from '../../../../public/common/character-counter/character-counter';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { resolveAdminCoworkerDocumentError } from '../admin-coworker-document-errors';
import { AdminCoworkerDocumentError } from '../admin-coworker-document-error/admin-coworker-document-error';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';
import {
  ACTIVE_DATE_RANGE_ERROR,
  addDocumentDefinitionArrayItem,
  createDocumentDefinitionForm,
  mapDocumentDefinitionFormToPayload,
  populateDocumentDefinitionForm,
} from './document-definition-form';

@Component({
  selector: 'app-document-definition-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    ToggleSwitchModule,
    CharacterCounter,
    ContextHelp,
    AdminCoworkerDocumentError,
  ],
  templateUrl: './document-definition-editor.html',
})
export class DocumentDefinitionEditor {
  private readonly documents = inject(AdminCoworkerDocuments);

  readonly definition = input<IAdminCoworkerDocumentDefinition | null>(null);
  readonly signaturePolicies = input.required<readonly ICoworkerSignaturePolicy[]>();
  readonly disabled = input(false);
  readonly saved = output<void>();
  readonly cancelled = output<void>();
  readonly reloadRequested = output<EdgeFunctionError>();
  readonly accessError = output<EdgeFunctionError>();
  readonly busyChange = output<boolean>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly limits = COWORKER_DOCUMENT_DEFINITION_LIMITS;
  protected readonly resolveError = resolveAdminCoworkerDocumentError;
  protected readonly resolveFieldError = resolveEdgeFormFieldError;
  protected readonly activeDateRangeError = ACTIVE_DATE_RANGE_ERROR;
  protected readonly isSaving = signal(false);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly originPolicyOptions = computed(() =>
    COWORKER_DOCUMENT_ORIGIN_POLICIES.map((value) => ({
      value,
      label: this.i18n.options().originPolicies[value],
    })),
  );
  protected readonly multiplicityOptions = computed(() =>
    COWORKER_DOCUMENT_MULTIPLICITIES.map((value) => ({
      value,
      label: this.i18n.options().multiplicities[value],
    })),
  );
  protected readonly signaturePolicyOptions = computed(() =>
    this.signaturePolicies().map((policy) => ({
      value: policy.code,
      label: policy.name,
    })),
  );

  protected readonly form = createDocumentDefinitionForm();

  constructor() {
    effect(() => {
      this.actionError.set(null);
      populateDocumentDefinitionForm(this.form, this.definition());
    });
    effect(() => {
      this.definition();
      const policies = this.signaturePolicies();
      const currentCode = this.form.controls.signaturePolicyCode.value;
      if (
        currentCode !== '' &&
        !policies.some((policy) => policy.code === currentCode)
      ) {
        this.form.controls.signaturePolicyCode.setValue('', {
          emitEvent: false,
        });
      }
    });
    effect(() =>
      setControlEnabled(this.form, !this.disabled() && !this.isSaving()),
    );
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.actionError.set(null));
  }

  protected addArrayItem(field: AdminCoworkerDocumentArrayField): void {
    addDocumentDefinitionArrayItem(this.form, field);
  }

  protected removeArrayItem(
    field: AdminCoworkerDocumentArrayField,
    index: number,
  ): void {
    this.form.controls[field].removeAt(index);
  }

  protected saveDefinition(): void {
    if (this.form.invalid || this.isSaving() || this.disabled()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = mapDocumentDefinitionFormToPayload(
      this.form,
      this.definition()?.id ?? null,
    );

    this.isSaving.set(true);
    this.busyChange.emit(true);
    this.actionError.set(null);
    this.documents
      .saveDefinition(payload)
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.busyChange.emit(false);
        }),
      )
      .subscribe({
        next: () => this.saved.emit(),
        error: (error) => {
          const normalized = normalizeEdgeFunctionError(
            error,
            this.i18n.errors().saveDefinition,
          );
          this.actionError.set(normalized);
          if (isEdgeAccessError(normalized)) {
            this.accessError.emit(normalized);
            return;
          }
          if (
            normalized.status === HttpStatusCode.NotFound ||
            normalized.status === HttpStatusCode.Conflict
          ) {
            this.reloadRequested.emit(normalized);
          }
        },
      });
  }
}
