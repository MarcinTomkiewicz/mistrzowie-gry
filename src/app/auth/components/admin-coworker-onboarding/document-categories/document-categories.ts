import { Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import type { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { finalize, Observable, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { DEFAULT_COWORKER_DOCUMENT_CATEGORY } from '../../../../core/configs/coworker-onboarding.config';
import type {
  IAdminCoworkerDocumentCategory,
  IAdminCoworkerDocumentCategoryEvent,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { AdminCoworkerOnboarding } from '../../../../core/services/admin-coworker-onboarding/admin-coworker-onboarding';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { scrollElementIntoViewWhenReady } from '../../../../core/utils/scroll';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import { createAdminCoworkerShellI18n } from '../../admin-coworkers/admin-coworker-shell/admin-coworker-shell.i18n';
import { DocumentOperations } from '../document-operations/document-operations';
import { getOnboardingMutationErrorToast } from '../onboarding-error';

@Component({
  selector: 'app-document-categories',
  imports: [
    ReactiveFormsModule, ButtonModule, IftaLabelModule, InputTextModule,
    TableModule, LoadingOverlay, DocumentOperations,
  ],
  templateUrl: './document-categories.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class DocumentCategories {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly editor = viewChild<ElementRef<HTMLElement>>('categoryEditor');
  private readonly historyPanel = viewChild<ElementRef<HTMLElement>>('categoryHistory');
  private historySubscription: Subscription | null = null;

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly tabs = createAdminCoworkerShellI18n().tabs;
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly categories = signal<IAdminCoworkerDocumentCategory[]>([]);
  protected readonly categoriesByKey = computed(() => new Map(
    this.categories().map((category) => [category.category_key, category]),
  ));
  protected readonly rows = computed(() => this.categories().map((category) => {
    const copy = this.i18n.categories();
    const menu = [this.historyOperation(category.category_key)];
    if (this.canRetire(category)) {
      menu.push({
        label: copy.retire,
        icon: 'pi pi-box',
        command: () => this.confirmRetire(category),
      });
    }
    return { category, menu };
  }));
  protected readonly catalogOperations = computed(() => [this.historyOperation(null)]);
  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);
  protected readonly busy = computed(() => this.loading() || this.saving());
  protected readonly editingCategory = signal<IAdminCoworkerDocumentCategory | null>(null);
  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [requiredTrimmedValidator(), Validators.maxLength(80)],
  });
  protected readonly form = new FormGroup({ name: this.name });

  protected readonly historyKey = signal<string | null | undefined>(undefined);
  protected readonly history = signal<readonly IAdminCoworkerDocumentCategoryEvent[]>([]);
  protected readonly historyLoading = signal(false);
  protected readonly historyFailed = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.getDocumentCategories().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (categories) => this.categories.set([...categories]),
      error: () => this.loadFailed.set(true),
    });
  }

  protected editCategory(category: IAdminCoworkerDocumentCategory): void {
    this.editingCategory.set(category);
    this.name.reset(category.category_name);
    scrollElementIntoViewWhenReady(() => this.editor()?.nativeElement);
  }

  protected resetName(): void {
    this.editingCategory.set(null);
    this.name.reset();
  }

  protected saveCategory(): void {
    const category = this.editingCategory();
    const name = this.name.value.trim();
    if (this.name.invalid || name === category?.category_name) return;

    this.runMutation(
      this.api.saveDocumentCategory(category?.category_key ?? null, name),
      () => this.resetName(),
    );
  }

  private canRetire(category: IAdminCoworkerDocumentCategory): boolean {
    return category.status === 'active' &&
      category.category_key !== DEFAULT_COWORKER_DOCUMENT_CATEGORY;
  }

  private confirmRetire(category: IAdminCoworkerDocumentCategory): void {
    const copy = this.i18n.categories();
    this.confirm.modalDecision({
      header: copy.retire,
      message: copy.retireMessage.replace('{{name}}', () => category.category_name),
      acceptLabel: copy.retire,
      rejectLabel: this.i18n.commonActions().cancel,
      acceptSeverity: 'danger',
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((accepted) => {
        const current = this.categoriesByKey().get(category.category_key);
        if (!accepted || !current || !this.canRetire(current)) return;

        this.runMutation(this.api.retireDocumentCategory(current.category_key), () => {
          if (this.editingCategory()?.category_key === current.category_key) this.resetName();
        });
      });
  }

  protected loadHistory(categoryKey: string | null): void {
    this.historySubscription?.unsubscribe();
    this.historyKey.set(categoryKey);
    this.history.set([]);
    this.historyLoading.set(true);
    this.historyFailed.set(false);
    this.historySubscription = this.api.getDocumentCategoryHistory(categoryKey).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.historyLoading.set(false)),
    ).subscribe({
      next: (events) => this.history.set(events),
      error: () => this.historyFailed.set(true),
    });
  }

  private historyOperation(categoryKey: string | null): MenuItem {
    return {
      label: this.i18n.categories().history,
      icon: 'pi pi-history',
      command: () => {
        this.loadHistory(categoryKey);
        scrollElementIntoViewWhenReady(() => this.historyPanel()?.nativeElement);
      },
    };
  }

  protected historyValue(
    event: IAdminCoworkerDocumentCategoryEvent,
    value: string | null,
  ): string | null {
    if (value === null || event.event_type !== 'assigned') return value;
    return this.categoriesByKey().get(value)?.category_name ?? null;
  }

  private runMutation(request: Observable<unknown>, after: () => void): void {
    if (this.busy() || this.loadFailed()) return;
    this.saving.set(true);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => {
        after();
        this.toast.success({
          summary: this.i18n.toast().mutationSuccessSummary,
          detail: this.i18n.commonStatus().changesSaved,
        });
        this.load();
        const historyKey = this.historyKey();
        if (historyKey !== undefined) this.loadHistory(historyKey);
      },
      error: (error: unknown) =>
        this.toast.danger(getOnboardingMutationErrorToast(error, this.i18n.toast())),
    });
  }
}
