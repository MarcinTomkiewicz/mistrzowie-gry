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

import { ADMIN_OPERATIONAL_VERSION_LIMITS } from '../../../../core/configs/admin-coworker-operational-documents.config';
import {
  IAdminOperationalCatalog,
} from '../../../../core/interfaces/i-admin-operational-catalog';
import {
  IAdminOperationalDocumentDetail,
} from '../../../../core/interfaces/i-admin-operational-document';
import { AdminCoworkerOperationalDocuments } from '../../../../core/services/admin-coworker-operational-documents/admin-coworker-operational-documents';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import {
  isEdgeAccessError,
  isEdgeMutationResultUncertain,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { resolveEdgeFormFieldError, setControlEnabled } from '../../../../core/utils/form-controls';
import { CharacterCounter } from '../../../../public/common/character-counter/character-counter';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { resolveAdminOperationalError } from '../admin-operational-document-errors';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import { TargetEditor } from '../target-editor/target-editor';
import { VersionUpload } from '../version-upload/version-upload';
import {
  createAdminOperationalVersionForm,
  mapAdminOperationalConfiguration,
  populateAdminOperationalVersionForm,
  syncAdminOperationalStatements,
} from './version-form';

@Component({
  selector: 'app-admin-operational-version-editor',
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
    TargetEditor,
    VersionUpload,
  ],
  templateUrl: './version-editor.html',
})
export class VersionEditor {
  private readonly documents = inject(AdminCoworkerOperationalDocuments);
  private readonly toast = inject(UiToast);
  private loadedFormKey: string | null = null;

  readonly document = input.required<IAdminOperationalDocumentDetail>();
  readonly catalog = input.required<IAdminOperationalCatalog>();
  readonly disabled = input(false);
  readonly reloadRequested = output<void>();
  readonly busyChange = output<boolean>();

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly limits = ADMIN_OPERATIONAL_VERSION_LIMITS;
  protected readonly form = createAdminOperationalVersionForm();
  protected readonly isConfiguring = signal(false);
  protected readonly uploadBusy = signal(false);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly isAccessBlocked = computed(
    () => isEdgeAccessError(this.actionError()),
  );
  protected readonly draftVersion = computed(
    () => this.document().versions.find((version) => version.status === 'ready') ?? null,
  );
  protected readonly recovery = computed(() => this.document().uploadRecovery);
  protected readonly actionModeOptions = computed(() =>
    this.catalog().actionModes.map((value) => ({
      value,
      label: this.i18n.statuses().actionModes[value],
    })),
  );
  protected readonly actionErrorDescription = computed(() => {
    const error = this.actionError();
    return error === null
      ? ''
      : resolveAdminOperationalError(
          error,
          this.i18n.errors(),
          this.i18n.errors().configure,
        );
  });

  constructor() {
    effect(() => {
      const document = this.document();
      const draft = this.draftVersion();
      const formKey = draft?.id ?? `new:${document.id}`;
      if (formKey === this.loadedFormKey) return;
      populateAdminOperationalVersionForm(
        this.form,
        document,
        draft,
        this.catalog(),
      );
      this.loadedFormKey = formKey;
      this.actionError.set(null);
    });
    effect(() =>
      setControlEnabled(
        this.form,
        !this.disabled() &&
          !this.isConfiguring() &&
          !this.uploadBusy() &&
          !this.isAccessBlocked() &&
          this.recovery() === null,
      ),
    );
    this.form.controls.metadata.controls.actionMode.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => syncAdminOperationalStatements(this.form));
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.isAccessBlocked()) this.actionError.set(null);
      });
  }

  protected configureVersion(): void {
    const draft = this.draftVersion();
    this.form.controls.metadata.controls.actionDueAt.updateValueAndValidity();
    if (
      draft === null ||
      this.form.invalid ||
      this.isConfiguring() ||
      this.uploadBusy() ||
      this.isAccessBlocked() ||
      this.disabled()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const configuration = mapAdminOperationalConfiguration(this.form, draft.id);
    this.actionError.set(null);
    this.setConfiguring(true);
    this.documents.configureVersion(configuration, draft).pipe(
      finalize(() => this.setConfiguring(false)),
    ).subscribe({
      next: () => {
        this.loadedFormKey = null;
        this.toast.success({
          summary: this.i18n.messages().versionSavedSummary,
          detail: this.i18n.messages().configurationSaved,
        });
        this.reloadRequested.emit();
      },
      error: (error) => {
        const normalized = normalizeEdgeFunctionError(
          error,
          this.i18n.errors().configure,
        );
        this.actionError.set(normalized);
        if (
          normalized.status === HttpStatusCode.Conflict ||
          isEdgeMutationResultUncertain(normalized)
        ) {
          this.loadedFormKey = null;
          this.reloadRequested.emit();
        }
      },
    });
  }

  protected fieldError(field: string): string | null {
    const control = this.form.controls.metadata.get(field)!;
    const prefix = this.draftVersion() === null ? 'upload' : 'configuration';
    return resolveEdgeFormFieldError(
      control,
      `${prefix}.${field}`,
      this.actionError(),
      this.i18n.commonForm(),
    );
  }

  protected statementError(index: number): string | null {
    return resolveEdgeFormFieldError(
      this.form.controls.statements.controls[index]!.controls.text,
      `configuration.statements.${index}.text`,
      this.actionError(),
      this.i18n.commonForm(),
    );
  }

  protected setUploadBusy(busy: boolean): void {
    this.uploadBusy.set(busy);
    this.busyChange.emit(busy || this.isConfiguring());
  }

  private setConfiguring(configuring: boolean): void {
    this.isConfiguring.set(configuring);
    this.busyChange.emit(configuring || this.uploadBusy());
  }
}
