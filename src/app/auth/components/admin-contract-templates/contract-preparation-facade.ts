import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';

import { CONTRACT_TEMPLATE_PDF_MIME } from '../../../core/configs/admin-contract-templates.config';
import type { IPdfPreview, IPdfPreviewResult } from '../../../core/interfaces/i-pdf';
import {
  ContractTemplateLibrary, type ContractTemplateLoadResult, type VerifiedContractTemplate,
} from '../../../core/services/admin-contract-templates/contract-template-library';
import { ContractPdfFill, type ContractPdfFillResult } from '../../../core/services/contract-pdf-fill/contract-pdf-fill';
import { Platform } from '../../../core/services/platform/platform';
import type { ContractValues } from '../../../core/types/contract-template-configuration';
import { EdgeFunctionError } from '../../../core/types/edge-function-error';

type LoadState = ContractTemplateLoadResult | { status: 'idle' | 'loading' } |
  { status: 'load-failed'; accessError: 'sessionExpired' | 'accessDenied' | null };
type FieldIssue = Extract<ContractPdfFillResult, { status: 'invalid-fields' }>['errors'][number] & { label: string };
type GenerationState =
  | { status: 'idle' | 'generating' | 'failed' | 'missing-data' }
  | { status: 'invalid-fields'; errors: readonly FieldIssue[] }
  | { status: 'filled'; pdf: Blob; snapshot: VerifiedContractTemplate };

@Injectable()
export class ContractPreparationFacade {
  private readonly library = inject(ContractTemplateLibrary);
  private readonly filler = inject(ContractPdfFill);
  private readonly platform = inject(Platform);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequest?: Subscription;
  private generationVersion = 0;

  private readonly loadState = signal<LoadState>({ status: 'idle' });
  private readonly generationState = signal<GenerationState>({ status: 'idle' });
  private readonly activePreview = signal<IPdfPreview | null>(null);
  private readonly viewerResult = signal<IPdfPreviewResult | null>(null);

  readonly template = this.loadState.asReadonly();
  readonly generation = this.generationState.asReadonly();
  readonly preview = this.activePreview.asReadonly();
  readonly previewResult = this.viewerResult.asReadonly();
  readonly generating = computed(() => this.generation().status === 'generating');
  readonly busy = computed(() => this.template().status === 'loading' || this.generating());

  constructor() {
    this.destroyRef.onDestroy(() => this.invalidate());
  }

  load(family: string | null): void {
    if (this.destroyRef.destroyed || !this.platform.isBrowser) return;
    this.loadRequest?.unsubscribe();
    this.invalidate();
    if (family === null) {
      this.loadState.set({ status: 'idle' });
      return;
    }
    this.loadState.set({ status: 'loading' });
    this.loadRequest = this.library.loadActive(family).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => this.loadState.set(result),
      error: (error: unknown) => {
        const status = error instanceof EdgeFunctionError ? error.status : null;
        this.loadState.set({ status: 'load-failed', accessError: status === 401 ? 'sessionExpired' : status === 403 ? 'accessDenied' : null });
      },
    });
  }

  async generate(snapshot: VerifiedContractTemplate, values: ContractValues): Promise<void> {
    if (this.destroyRef.destroyed || !this.platform.isBrowser || this.preview() || this.generating()) return;
    const current = this.generation();
    if (current.status === 'filled' && current.snapshot === snapshot) {
      this.openPreview(current.pdf);
      return;
    }
    this.invalidate();
    const version = this.generationVersion;
    this.generationState.set({ status: 'generating' });
    try {
      const result = await this.filler.fill(snapshot, values);
      if (version !== this.generationVersion) return;
      if (result.status === 'missing-data') {
        this.generationState.set(result);
        return;
      }
      if (result.status === 'invalid-fields') {
        const labels = new Map(snapshot.revision.configuration?.fields.map(({ id, label }) => [id, label]));
        this.generationState.set({
          status: 'invalid-fields',
          errors: result.errors.map((error) => ({ ...error, label: labels.get(error.fieldId) ?? error.fieldId })),
        });
        return;
      }
      const pdf = new Blob([Uint8Array.from(result.pdfBytes)], { type: CONTRACT_TEMPLATE_PDF_MIME });
      this.generationState.set({ status: 'filled', pdf, snapshot });
      this.openPreview(pdf);
    } catch {
      if (version === this.generationVersion) this.generationState.set({ status: 'failed' });
    }
  }

  invalidate(): void {
    this.generationVersion++;
    this.closePreview();
    this.viewerResult.set(null);
    this.generationState.set({ status: 'idle' });
  }

  private openPreview(pdf: Blob): void {
    this.viewerResult.set(null);
    this.activePreview.set({ url: URL.createObjectURL(pdf), title: 'umowa.pdf' });
  }

  recordPreviewResult(result: IPdfPreviewResult): void {
    if (this.activePreview()?.url === result.url) this.viewerResult.set(result);
  }

  closePreview(): void {
    const preview = this.preview();
    if (preview === null) return;
    this.activePreview.set(null);
    URL.revokeObjectURL(preview.url);
  }

  download(): void {
    const result = this.generation();
    if (result.status === 'filled' && result.snapshot.revision.status === 'active') {
      this.platform.downloadBlob(result.pdf, 'umowa.pdf');
    }
  }
}
