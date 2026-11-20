import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormRecord, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { map } from 'rxjs';

import { FileUpload } from '../../../../../common/file-upload/file-upload';
import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import { COWORKER_PDF_UPLOAD_OPTIONS } from '../../../../../core/configs/coworker-onboarding.config';
import { createCoworkerOnboardingI18n } from '../../../../../core/translations/coworker-onboarding.i18n';
import { normalizeText } from '../../../../../core/utils/normalize-text';
import { stablePartition } from '../../../../../core/utils/stable-partition';
import { DocumentOperations } from '../../../../common/document-operations/document-operations';
import {
  createDocumentMenu,
  type DocumentFileRequest,
  type PrivateDocumentRow,
} from '../onboarding-document-view';

@Component({
  selector: 'app-coworker-private-documents',
  imports: [
    NgTemplateOutlet, RouterLink, FormsModule, ReactiveFormsModule, AccordionModule, ButtonModule,
    CheckboxModule, FloatLabelModule, InputTextModule, SelectModule, TableModule, ToggleSwitchModule,
    DocumentOperations, FileUpload,
  ],
  templateUrl: './coworker-private-documents.html',
})
export class CoworkerPrivateDocuments {
  readonly rows = input.required<readonly PrivateDocumentRow[]>();
  readonly hasOnboarding = input.required<boolean>();
  readonly questionnaireComplete = input.required<boolean>();
  readonly declarationControls = input.required<FormRecord<FormControl<boolean>>>();
  readonly selectedFiles = input.required<ReadonlyMap<string, File>>();
  readonly activeMutationKey = input.required<string | null>();
  readonly busy = input.required<boolean>();
  readonly fileRequested = output<DocumentFileRequest>();
  readonly signedFilesSelected = output<{ assignmentId: string; files: readonly File[] }>();
  readonly signatureSubmitted = output<string>();
  readonly acknowledgementRequested = output<string>();

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly uploadOptions = computed(() => ({
    ...COWORKER_PDF_UPLOAD_OPTIONS,
    disabled: this.busy(),
  }));
  protected readonly filterForm = new FormGroup({
    searchText: new FormControl('', { nonNullable: true }),
    category: new FormControl<string | null>(null),
    actionRequiredOnly: new FormControl(false, { nonNullable: true }),
  });
  private readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(map(() => this.filterForm.getRawValue())),
    { initialValue: this.filterForm.getRawValue() },
  );
  private readonly categoryLabels = computed(() => {
    const retiredLabel = this.i18n.categories().retired;
    const labels = new Map<string, string>();
    for (const { document } of this.rows()) {
      const { category, category_name: name, category_status: status } = document;
      labels.set(category, status === 'retired' ? `${name} (${retiredLabel})` : name);
    }
    return labels;
  });
  protected readonly categoryOptions = computed(() =>
    Array.from(this.categoryLabels(), ([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pl') || a.value.localeCompare(b.value)),
  );

  protected readonly visible = computed(() => {
    const { searchText, category, actionRequiredOnly } = this.filters();
    const query = normalizeText(searchText)?.toLocaleLowerCase('pl');
    const matches = this.rows().filter(({ document, pendingAction }) =>
      (!category || document.category === category) &&
      (!query || document.title.toLocaleLowerCase('pl').includes(query)) &&
      (!actionRequiredOnly || pendingAction !== null),
    );

    const labels = this.i18n.actions();
    const { assignment, requiredAction, pendingAcknowledgement } = this.i18n.statuses();
    const categoryLabels = this.categoryLabels();
    const rows = matches.map((row) => ({
      ...row,
      categoryLabel: categoryLabels.get(row.document.category),
      statusLabel: row.pendingAction === 'acknowledge'
        ? pendingAcknowledgement : assignment?.[row.document.assignment_status],
      statusClass: row.historical ? 'tag-badge--muted' : STATUS_BADGE_CLASS[row.document.assignment_status],
      actionLabel: requiredAction?.[row.document.required_action],
      menu: createDocumentMenu(
        row.document,
        labels,
        (event) => this.fileRequested.emit(event),
        row.pendingAction === 'acknowledge' ? (id) => this.acknowledgementRequested.emit(id) : undefined,
      ),
    }));

    return {
      current: stablePartition(rows.filter((row) => !row.historical), (row) => row.pendingAction !== null),
      history: rows.filter((row) => row.historical),
    };
  });

  constructor() {
    effect(() => {
      const categories = this.categoryLabels();
      const control = this.filterForm.controls.category;
      if (control.value !== null && !categories.has(control.value)) control.reset();
    });
  }
}
