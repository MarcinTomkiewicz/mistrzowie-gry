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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';

import {
  IAdminCoworkerCatalogEntry,
  IAdminCoworkerDocumentDefinition,
} from '../../../../core/interfaces/i-admin-coworker-document';
import { AdminCoworkerDocuments } from '../../../../core/services/admin-coworker-documents/admin-coworker-documents';
import { AdminCoworkerRequirementPayload } from '../../../../core/types/admin-coworker-document';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { normalizeEdgeFunctionError } from '../../../../core/utils/edge-function-error-mapping';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import {
  isAdminCoworkerDocumentStaleError,
  resolveAdminCoworkerDocumentError,
  resolveAdminCoworkerDocumentFieldError,
} from '../admin-coworker-document-errors';
import { AdminCoworkerDocumentError } from '../admin-coworker-document-error/admin-coworker-document-error';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-requirement-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    IftaLabelModule,
    SelectModule,
    ToggleSwitchModule,
    AdminCoworkerDocumentError,
  ],
  templateUrl: './requirement-editor.html',
})
export class RequirementEditor {
  private readonly documents = inject(AdminCoworkerDocuments);

  readonly coworker = input.required<IAdminCoworkerCatalogEntry>();
  readonly definitions = input.required<readonly IAdminCoworkerDocumentDefinition[]>();
  readonly onboardingCaseId = input<string | null>(null);
  readonly disabled = input(false);
  readonly assigned = output<void>();
  readonly reloadRequested = output<EdgeFunctionError>();
  readonly accessError = output<EdgeFunctionError>();
  readonly busyChange = output<boolean>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly resolveError = resolveAdminCoworkerDocumentError;
  protected readonly resolveFieldError =
    resolveAdminCoworkerDocumentFieldError;
  protected readonly isSaving = signal(false);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly userId = computed(() => this.coworker().userId);
  protected readonly definitionOptions = computed(() =>
    this.definitions()
      .filter((definition) => definition.isActive)
      .map((definition) => ({
        value: definition.id,
        label: `${definition.title} (${definition.code})`,
      })),
  );
  protected readonly form = new FormGroup({
    documentDefinitionId: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    required: new FormControl(true, { nonNullable: true }),
    dueAt: new FormControl<Date | null>(null),
  });

  constructor() {
    effect(() =>
      setControlEnabled(this.form, !this.disabled() && !this.isSaving()),
    );
    effect(() => {
      this.userId();
      this.actionError.set(null);
      this.form.reset(
        { documentDefinitionId: '', required: true, dueAt: null },
        { emitEvent: false },
      );
    });
    effect(() => {
      const definitions = this.definitions();
      const currentId = this.form.controls.documentDefinitionId.value;
      if (
        currentId !== '' &&
        !definitions.some(
          (definition) => definition.isActive && definition.id === currentId,
        )
      ) {
        this.form.controls.documentDefinitionId.setValue('', {
          emitEvent: false,
        });
      }
    });
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.actionError.set(null));
  }

  protected assignRequirement(): void {
    if (this.form.invalid || this.isSaving() || this.disabled()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const requirement: AdminCoworkerRequirementPayload = {
      userId: this.userId(),
      onboardingCaseId: this.onboardingCaseId(),
      documentDefinitionId: value.documentDefinitionId,
      required: value.required,
      dueAt: value.dueAt?.toISOString() ?? null,
    };

    this.isSaving.set(true);
    this.busyChange.emit(true);
    this.actionError.set(null);
    this.documents
      .assignRequirement(requirement)
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.busyChange.emit(false);
        }),
      )
      .subscribe({
        next: () => {
          this.form.reset(
            { documentDefinitionId: '', required: true, dueAt: null },
            { emitEvent: false },
          );
          this.assigned.emit();
        },
        error: (error) => {
          const normalized = normalizeEdgeFunctionError(
            error,
            this.i18n.errors().assignRequirement,
          );
          this.actionError.set(normalized);
          if (normalized.status === 401 || normalized.status === 403) {
            this.accessError.emit(normalized);
            return;
          }
          if (normalized.status === 404 || normalized.status === 409) {
            if (isAdminCoworkerDocumentStaleError(normalized)) {
              this.form.controls.documentDefinitionId.setValue('', {
                emitEvent: false,
              });
            }
            this.reloadRequested.emit(normalized);
          }
        },
      });
  }
}
