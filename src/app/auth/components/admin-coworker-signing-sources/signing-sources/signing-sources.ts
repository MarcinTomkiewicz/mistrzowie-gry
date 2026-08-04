import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { finalize, forkJoin } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { IAdminCoworkerOnboardingResult } from '../../../../core/interfaces/i-admin-coworker-document';
import { IAdminCoworkerSigningSourceCatalogItem } from '../../../../core/interfaces/i-admin-coworker-signing-source';
import { IUser } from '../../../../core/interfaces/i-user';
import { AdminCoworkerDocuments } from '../../../../core/services/admin-coworker-documents/admin-coworker-documents';
import { AdminCoworkerSigningSources } from '../../../../core/services/admin-coworker-signing-sources/admin-coworker-signing-sources';
import { AdminUsers } from '../../../../core/services/admin-users/admin-users';
import {
  ADMIN_COWORKER_GLOBAL_SIGNING_SOURCE_CODES,
  AdminCoworkerGlobalSigningSourceCode,
  AdminCoworkerSigningSourceTarget,
} from '../../../../core/types/admin-coworker-signing-source';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { formatTimestampLabel } from '../../../../core/utils/date';
import {
  isEdgeAccessError,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { SigningSourceWorkspace } from '../signing-source-workspace/signing-source-workspace';
import {
  ADMIN_COWORKER_SIGNING_SOURCES_SCOPE,
  createAdminCoworkerSigningSourcesI18n,
} from './signing-sources.i18n';

@Component({
  selector: 'app-admin-coworker-signing-sources',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    SelectModule,
    LoadingOverlay,
    SigningSourceWorkspace,
  ],
  templateUrl: './signing-sources.html',
  providers: [
    provideTranslocoScope(ADMIN_COWORKER_SIGNING_SOURCES_SCOPE, 'common'),
  ],
})
export class SigningSources {
  private readonly documents = inject(AdminCoworkerDocuments);
  private readonly signingSources = inject(AdminCoworkerSigningSources);
  private readonly adminUsers = inject(AdminUsers);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly i18n = createAdminCoworkerSigningSourcesI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly catalog = signal<
    readonly IAdminCoworkerSigningSourceCatalogItem[]
  >([]);
  protected readonly users = signal<readonly IUser[]>([]);
  protected readonly onboarding = signal<IAdminCoworkerOnboardingResult | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly onboardingBusy = signal(false);
  protected readonly globalWorkspaceBusy = signal(false);
  protected readonly individualWorkspaceBusy = signal(false);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly onboardingError = signal<EdgeFunctionError | null>(null);
  protected readonly globalSourceControl =
    new FormControl<AdminCoworkerGlobalSigningSourceCode>(
      'safety_protocol',
      { nonNullable: true },
    );
  protected readonly coworkerControl = new FormControl<string | null>(null);
  protected readonly onboardingControl = new FormControl<string | null>(null);

  private readonly selectedGlobalCode = toSignal(
    this.globalSourceControl.valueChanges,
    { initialValue: this.globalSourceControl.value },
  );
  private readonly selectedCoworkerId = toSignal(
    this.coworkerControl.valueChanges,
    { initialValue: this.coworkerControl.value },
  );
  private readonly selectedOnboardingId = toSignal(
    this.onboardingControl.valueChanges,
    { initialValue: this.onboardingControl.value },
  );

  protected readonly baseInteractionsBlocked = computed(
    () => this.isLoading() || isEdgeAccessError(this.loadError()),
  );
  protected readonly globalSelectionBlocked = computed(
    () => this.baseInteractionsBlocked() || this.globalWorkspaceBusy(),
  );
  protected readonly individualSelectionBlocked = computed(
    () => this.baseInteractionsBlocked() || this.onboardingBusy() ||
      this.individualWorkspaceBusy(),
  );
  protected readonly globalOptions = computed(() => {
    const labels = this.i18n.statuses().sources;
    return ADMIN_COWORKER_GLOBAL_SIGNING_SOURCE_CODES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly coworkerOptions = computed(() =>
    this.users().map((user) => ({ value: user.id, label: this.coworkerLabel(user) })),
  );
  protected readonly onboardingOptions = computed(() => {
    const onboarding = this.onboarding();
    return onboarding === null
      ? []
      : [{
          value: onboarding.case.id,
          label: `${this.i18n.fields().onboarding} — ${
            formatTimestampLabel(onboarding.case.openedAt, 'pl-PL') ?? ''
          }`,
        }];
  });
  protected readonly selectedCoworker = computed(
    () => this.users().find((user) => user.id === this.selectedCoworkerId()) ?? null,
  );
  protected readonly globalSource = computed(() => this.catalog().find(
    (source) => source.sourceType === 'global_template' &&
      source.sourceCode === this.selectedGlobalCode(),
  ) ?? null);
  protected readonly globalTarget = computed<AdminCoworkerSigningSourceTarget>(
    () => ({
      sourceId: this.globalSource()?.id ?? null,
      sourceType: 'global_template',
      sourceCode: this.selectedGlobalCode(),
      onboardingCaseId: null,
    }),
  );
  protected readonly individualSource = computed(() => {
    const onboardingCaseId = this.selectedOnboardingId();
    const userId = this.selectedCoworkerId();
    if (onboardingCaseId === null || userId === null) return null;
    return this.catalog().find((source) =>
      source.sourceType === 'onboarding_case' &&
      source.sourceCode === 'mandate_contract' &&
      source.onboardingCaseId === onboardingCaseId &&
      source.userId === userId,
    ) ?? null;
  });
  protected readonly individualTarget = computed<AdminCoworkerSigningSourceTarget | null>(
    () => {
      const onboardingCaseId = this.selectedOnboardingId();
      if (onboardingCaseId === null) return null;
      return {
        sourceId: this.individualSource()?.id ?? null,
        sourceType: 'onboarding_case',
        sourceCode: 'mandate_contract',
        onboardingCaseId,
      };
    },
  );

  constructor() {
    effect(() => {
      setControlEnabled(this.globalSourceControl, !this.globalSelectionBlocked());
      setControlEnabled(this.coworkerControl, !this.individualSelectionBlocked());
      setControlEnabled(
        this.onboardingControl,
        !this.individualSelectionBlocked() && this.onboarding() !== null,
      );
    });
    this.coworkerControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onboarding.set(null);
        this.onboardingControl.setValue(null);
        this.onboardingError.set(null);
      });
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    forkJoin({
      catalog: this.signingSources.getCatalog(),
      users: this.adminUsers.getUsers(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: ({ catalog, users }) => {
        this.catalog.set(catalog);
        this.users.set(users.map(({ user }) => user));
      },
      error: (error: unknown) => this.loadError.set(normalizeEdgeFunctionError(
        error,
        this.i18n.errors().loadCatalog,
      )),
    });
  }

  protected reloadCatalog(): void {
    this.signingSources.getCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalog) => this.catalog.set(catalog),
        error: (error: unknown) => this.loadError.set(normalizeEdgeFunctionError(
          error,
          this.i18n.errors().loadCatalog,
        )),
      });
  }

  protected loadOnboarding(): void {
    const coworkerId = this.selectedCoworkerId();
    if (coworkerId === null || this.individualSelectionBlocked()) return;

    this.onboardingBusy.set(true);
    this.onboardingError.set(null);
    this.documents.ensureOnboarding(coworkerId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.onboardingBusy.set(false)),
    ).subscribe({
      next: (onboarding) => {
        this.onboarding.set(onboarding);
        this.onboardingControl.setValue(onboarding.case.id);
        this.reloadCatalog();
      },
      error: (error: unknown) => this.onboardingError.set(
        normalizeEdgeFunctionError(error, this.i18n.errors().loadOnboarding),
      ),
    });
  }

  protected coworkerLabel(user: IUser): string {
    const displayName = getUserDisplayName(user);
    return displayName === '' ? user.email : `${displayName} — ${user.email}`;
  }
}
