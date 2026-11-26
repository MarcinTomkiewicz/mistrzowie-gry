import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, type Observable } from 'rxjs';

import type { IPdfPreviewResult } from '../../../core/interfaces/i-pdf';
import { AdminContractTemplates } from '../../../core/services/admin-contract-templates/admin-contract-templates';
import type { ContractConfiguration, ContractTemplate } from '../../../core/services/admin-contract-templates/admin-contract-templates.contract';
import { ContractTemplateLibrary, hasCompleteConfiguration, type CatalogContractTemplate } from '../../../core/services/admin-contract-templates/contract-template-library';
import {
  type ContractTemplateConfiguration, getConfigurationIssues, isContractConfiguration,
} from '../../../core/types/contract-template-configuration';
import { assertEdgeContract } from '../../../core/utils/edge-contract';
import { EdgeFunctionError } from '../../../core/types/edge-function-error';
import { ContractPreparationFacade } from './contract-preparation-facade';
import { ContractTemplatesFacade } from './contract-templates-facade';

@Injectable()
export class ContractConfigurationFacade {
  private readonly api = inject(AdminContractTemplates);
  private readonly library = inject(ContractTemplateLibrary);
  private readonly catalog = inject(ContractTemplatesFacade);
  private readonly destroyRef = inject(DestroyRef);
  readonly generation = inject(ContractPreparationFacade);

  readonly loaded = signal<CatalogContractTemplate | null>(null);
  readonly draft = signal<ContractTemplateConfiguration | null>(null);
  readonly pending = signal(false);
  readonly failed = signal(false);
  readonly conflict = signal(false);
  readonly readFailed = signal(false);
  readonly sourceUnavailable = signal(false);
  readonly remote = signal<ContractConfiguration | null>(null);

  readonly editable = computed(() => this.loaded()?.revision.status === 'staged' &&
    (this.remote() === null || this.remote()?.status === 'staged'));
  readonly dirty = computed(() => {
    const state = this.loaded();
    const draft = this.draft();
    if (!state || !draft) return false;
    return JSON.stringify(draft) !== JSON.stringify(this.toDraft(state));
  });
  readonly structural = computed(() => isContractConfiguration(this.draft()));
  readonly issues = computed(() => getConfigurationIssues(this.draft() ?? { pages: [], fields: [], placements: [] }));
  readonly canWrite = computed(() => this.editable() && !this.pending() && !this.failed() && !this.readFailed());
  readonly canPreview = computed(() => {
    const doc = this.loaded()?.document;
    return !this.pending() && !this.failed() && !this.readFailed() && !this.dirty() && !!doc && hasCompleteConfiguration(doc);
  });
  readonly activationPreview = computed(() => {
    const generated = this.generation.generation();
    const preview = this.generation.previewResult();
    return this.canWrite() && this.canPreview() && !this.generation.preview() &&
      generated.status === 'filled' && generated.snapshot === this.loaded()?.document &&
      preview?.status === 'rendered' ? preview : null;
  });

  async load(templateId: string): Promise<void> {
    if (this.pending()) return;
    this.generation.invalidate();
    this.pending.set(true);
    this.readFailed.set(false);
    try {
      const rows = await this.read(this.api.list());
      const template = rows.find((row) => row.template_id === templateId);
      if (!template) throw new Error('Template unavailable.');
      const state = await this.read(this.library.loadCatalog(template));
      this.accept(state);
    } catch {
      if (!this.destroyRef.destroyed) this.readFailed.set(true);
    } finally {
      if (!this.destroyRef.destroyed) this.pending.set(false);
    }
  }

  update(draft: ContractTemplateConfiguration): void {
    if (!this.editable() || this.pending()) return;
    this.generation.invalidate();
    this.draft.set(draft);
  }

  async save(): Promise<void> {
    const snapshot = this.loaded()?.document;
    const draft = this.draft();
    if (!this.canWrite() || !draft || !snapshot || !isContractConfiguration(draft)) return;
    await this.mutate(snapshot.template, async () => {
      const saved = await this.read(this.api.saveConfiguration(snapshot.revision, draft));
      await this.confirmRevision(snapshot.template, saved);
      return true;
    });
  }

  async copy(sourceId: string): Promise<boolean> {
    const snapshot = this.loaded()?.document;
    if (!this.canWrite() || !snapshot || sourceId === snapshot.template.template_id) return false;
    return this.mutate(snapshot.template, async () => {
      const source = await this.read(this.api.getConfiguration(sourceId, 'catalog'));
      if (!source.configuration || source.family !== snapshot.revision.family) {
        this.sourceUnavailable.set(true);
        return false;
      }
      const saved = await this.read(this.api.copyConfiguration(snapshot.revision, source, snapshot.pages));
      await this.confirmRevision(snapshot.template, saved);
      return true;
    });
  }

  async activate(confirmedPreview: IPdfPreviewResult): Promise<boolean> {
    const snapshot = this.loaded()?.document;
    if (!snapshot || confirmedPreview !== this.activationPreview()) return false;
    return this.mutate(snapshot.template, async () => {
      await this.read(this.api.approve(snapshot.revision, true));
      this.catalog.refresh();
      return true;
    });
  }

  keepDraft(): void {
    const remote = this.remote();
    const state = this.loaded();
    if (!remote || remote.status !== 'staged' || !state?.document || this.pending()) return;
    this.generation.invalidate();
    this.loaded.set({ revision: remote, document: { ...state.document, revision: remote } });
    this.failed.set(false);
    this.remote.set(null);
  }

  private async mutate(template: ContractTemplate, work: () => Promise<boolean>): Promise<boolean> {
    this.generation.invalidate();
    this.pending.set(true);
    this.sourceUnavailable.set(false);
    try {
      return await work();
    } catch (error: unknown) {
      if (this.destroyRef.destroyed) return false;
      this.failed.set(true);
      this.conflict.set(error instanceof EdgeFunctionError && error.status === 409);
      this.remote.set(null);
      try {
        const current = await this.read(this.api.getConfiguration(template.template_id, 'catalog'));
        assertEdgeContract(current.family === template.family && current.pdf_sha256 === template.pdf_sha256,
          'template', 'the same document identity');
        this.remote.set(current);
      } catch {
        this.remote.set(null);
      }
      this.catalog.refresh();
      return false;
    } finally {
      if (!this.destroyRef.destroyed) this.pending.set(false);
    }
  }

  private async confirmRevision(template: ContractTemplate, expected: ContractConfiguration): Promise<void> {
    const state = await this.read(this.library.loadCatalog(template));
    assertEdgeContract(state.revision.configuration_revision === expected.configuration_revision,
      'configuration_revision', 'the confirmed saved revision');
    this.accept(state);
  }

  private accept(state: CatalogContractTemplate): void {
    this.loaded.set(state);
    this.draft.set(this.toDraft(state));
    this.remote.set(null);
    this.failed.set(false);
    this.sourceUnavailable.set(false);
  }

  private toDraft(state: CatalogContractTemplate): ContractTemplateConfiguration {
    const config = state.revision.configuration;
    return {
      pages: state.document?.pages ?? config?.pages ?? [],
      fields: config?.fields ?? [],
      placements: config?.placements ?? [],
    };
  }

  private read<T>(request: Observable<T>): Promise<T> {
    return firstValueFrom(request.pipe(takeUntilDestroyed(this.destroyRef)));
  }
}
