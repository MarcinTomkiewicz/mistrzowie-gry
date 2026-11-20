import { Component, computed, input, output, type OnChanges, type SimpleChanges } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { map } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import type {
  IAdminCoworkerDocumentCategory,
  IAdminCoworkerOnboardingDocument,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { createCoworkerOnboardingI18n } from '../../../../core/translations/coworker-onboarding.i18n';
import type {
  CoworkerDocumentAssignmentStatus,
  CoworkerDocumentDownloadTarget,
  CoworkerOnboardingLifecycleStatus,
} from '../../../../core/types/coworker-onboarding';
import { setControlValue } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { stablePartition } from '../../../../core/utils/stable-partition';
import { DocumentOperations } from '../../../common/document-operations/document-operations';
import { isCurrentDocumentVersion } from '../document-version';

export type PrivateDocumentOperation = {
  readonly document: IAdminCoworkerOnboardingDocument;
} & (
  | { readonly kind: 'preview' | 'download'; readonly target: CoworkerDocumentDownloadTarget }
  | { readonly kind: 'accept' | 'reject' | 'remove' | 'reclassify' }
);

@Component({
  selector: 'app-private-document-list',
  imports: [
    ReactiveFormsModule, ButtonModule, FloatLabelModule, InputTextModule,
    SelectModule, TableModule, ToggleSwitchModule, DocumentOperations,
  ],
  templateUrl: './private-document-list.html',
})
export class PrivateDocumentList implements OnChanges {
  readonly onboardingId = input.required<string>();
  readonly documents = input.required<readonly IAdminCoworkerOnboardingDocument[]>();
  readonly categories = input.required<readonly IAdminCoworkerDocumentCategory[]>();
  readonly onboardingStatus = input.required<CoworkerOnboardingLifecycleStatus>();
  readonly busy = input(false);
  readonly categoryLoading = input(false);
  readonly categoryEditingEnabled = input(false);
  readonly operation = output<PrivateDocumentOperation>();

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly filterForm = new FormGroup({
    searchText: new FormControl('', { nonNullable: true }),
    category: new FormControl<string | null>(null),
    status: new FormControl<CoworkerDocumentAssignmentStatus | 'unassigned' | null>(null),
    hideRejected: new FormControl(true, { nonNullable: true }),
  });
  private readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(map(() => this.filterForm.getRawValue())),
    { initialValue: this.filterForm.getRawValue() },
  );
  protected readonly statusOptions = computed(() => [
    ...Object.entries(this.i18n.statuses().assignment ?? {}).map(([value, label]) => ({ value, label })),
    { value: 'unassigned', label: this.i18n.fields().noAssignment },
  ]);
  protected readonly categoryOptions = computed(() => this.categories().map((category) => ({
    value: category.category_key,
    label: category.status === 'retired'
      ? `${category.category_name} (${this.i18n.categories().retired})`
      : category.category_name,
  })));
  protected readonly rows = computed(() => {
    const categoryNames = new Map(this.categoryOptions().map(({ value, label }) => [value, label]));
    const { searchText, category, status, hideRejected } = this.filters();
    const query = normalizeText(searchText)?.toLocaleLowerCase('pl');
    const { assignment, requiredAction } = this.i18n.statuses();
    const documents = this.documents().filter((document) =>
      (!query || document.title.toLocaleLowerCase('pl').includes(query)) &&
      (!category || document.category === category) &&
      (!status || (document.assignment_status ?? 'unassigned') === status) &&
      (!hideRejected || document.assignment_status !== 'rejected'),
    );
    const rows = documents.map((document) => {
      const current = isCurrentDocumentVersion(document);
      const status = document.assignment_status;
      return {
        document,
        current,
        category: document.category === null ? null : categoryNames.get(document.category),
        statusLabel: status ? assignment?.[status] : this.i18n.fields().noAssignment,
        statusClass: status ? 'tag-badge text-wrap ' + STATUS_BADGE_CLASS[status] : '',
        actionLabel: document.required_action ? requiredAction?.[document.required_action] : null,
        menu: this.createOperations(document, current),
      };
    });
    return stablePartition(rows, (row) => row.current);
  });

  ngOnChanges(changes: SimpleChanges<PrivateDocumentList>): void {
    if (changes.onboardingId) this.filterForm.reset();
  }

  protected onStatusChange(): void {
    const { status, hideRejected } = this.filterForm.controls;
    if (status.value === 'rejected' && hideRejected.value) setControlValue(hideRejected, false);
  }

  protected onHideRejectedChange(): void {
    const { status, hideRejected } = this.filterForm.controls;
    if (hideRejected.value && status.value === 'rejected') setControlValue(status, null);
  }

  protected preview(document: IAdminCoworkerOnboardingDocument): void {
    this.operation.emit({ document, kind: 'preview', target: 'source' });
  }

  private createOperations(document: IAdminCoworkerOnboardingDocument, current: boolean): MenuItem[] {
    const actions = this.i18n.actions();
    const items: MenuItem[] = [];
    if (document.original_filename) {
      items.push({
        label: actions.download, icon: 'pi pi-missile-swarm',
        command: () => this.operation.emit({ document, kind: 'download', target: 'source' }),
      });
    }
    if (document.signed_original_filename) {
      items.push(
        {
          label: actions.previewSigned, icon: 'pi pi-evil-book',
          command: () => this.operation.emit({ document, kind: 'preview', target: 'signed' }),
        },
        {
          label: actions.downloadSigned, icon: 'pi pi-missile-swarm',
          command: () => this.operation.emit({ document, kind: 'download', target: 'signed' }),
        },
      );
    }
    if (current && document.assignment_id && document.assignment_status === 'submitted') {
      items.push(
        {
          label: actions.accept, icon: 'pi pi-check',
          command: () => this.operation.emit({ document, kind: 'accept' }),
        },
        {
          label: actions.reject, icon: 'pi pi-times',
          command: () => this.operation.emit({ document, kind: 'reject' }),
        },
      );
    }
    if (current && document.category !== null && document.document_status === 'active' &&
        this.categoryEditingEnabled()) {
      items.push({
        label: this.i18n.categories().change, icon: 'pi pi-quill',
        command: () => this.operation.emit({ document, kind: 'reclassify' }),
      });
    }
    if (current && document.source === 'uploaded' && this.onboardingStatus() === 'in_progress') {
      items.push({
        label: actions.removeDocument, icon: 'pi pi-trash',
        command: () => this.operation.emit({ document, kind: 'remove' }),
      });
    }
    return items;
  }
}
