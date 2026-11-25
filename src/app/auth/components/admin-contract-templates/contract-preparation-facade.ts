import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';

import {
  CONTRACT_TEMPLATE_PDF_MIME,
  type ContractTemplateFamily,
} from '../../../core/configs/admin-contract-templates.config';
import type { IPdfPreview } from '../../../core/interfaces/i-pdf';
import {
  ContractTemplateLibrary,
  type ContractTemplateLoadResult,
} from '../../../core/services/admin-contract-templates/contract-template-library';
import { ContractPdfFill, type ContractPdfFillResult } from '../../../core/services/contract-pdf-fill/contract-pdf-fill';
import { Platform } from '../../../core/services/platform/platform';
import { EdgeFunctionError } from '../../../core/types/edge-function-error';

const CONTRACT_FILENAME = 'umowa.pdf';

export type ContractPreparationSubmission = {
  readonly templateId: string;
  readonly fields: Readonly<Record<string, { readonly value: string | boolean; readonly label: string }>>;
  readonly fontFiles: Parameters<ContractPdfFill['fill']>[2];
};

type LoadState =
  | ContractTemplateLoadResult
  | { status: 'idle' | 'loading' }
  | { status: 'load-failed'; accessError: 'sessionExpired' | 'accessDenied' | null };
type FieldIssue = Extract<ContractPdfFillResult, { status: 'invalid-fields' }>['errors'][number] & {
  readonly label: string;
};
type GenerationState =
  | { status: 'idle' | 'generating' | 'missing-data' | 'failed' }
  | { status: 'invalid-fields'; errors: readonly FieldIssue[] }
  | { status: 'filled'; pdf: Blob };

@Injectable()
export class ContractPreparationFacade {
  private readonly library = inject(ContractTemplateLibrary);
  private readonly filler = inject(ContractPdfFill);
  private readonly platform = inject(Platform);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequest?: Subscription;

  private readonly loadState = signal<LoadState>({ status: 'idle' });
  private readonly generationState = signal<GenerationState>({ status: 'idle' });
  private readonly activePreview = signal<IPdfPreview | null>(null);

  readonly template = this.loadState.asReadonly();
  readonly generation = this.generationState.asReadonly();
  readonly preview = this.activePreview.asReadonly();
  readonly generating = computed(() => this.generation().status === 'generating');
  readonly busy = computed(() => this.template().status === 'loading' || this.generating());

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearGeneration();
      this.loadState.set({ status: 'idle' });
    });
  }

  load(family: ContractTemplateFamily | null): void {
    if (this.destroyRef.destroyed || !this.platform.isBrowser) return;
    this.loadRequest?.unsubscribe();
    this.clearGeneration();
    if (family === null) {
      this.loadState.set({ status: 'idle' });
      return;
    }

    this.loadState.set({ status: 'loading' });
    this.loadRequest = this.library.loadActive(family).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => this.loadState.set(result),
      error: (error: unknown) => {
        const status = error instanceof EdgeFunctionError ? error.status : null;
        const accessError = status === 401 ? 'sessionExpired' : status === 403 ? 'accessDenied' : null;
        this.loadState.set({ status: 'load-failed', accessError });
      },
    });
  }

  async generate(submission: ContractPreparationSubmission): Promise<void> {
    const snapshot = this.template();
    if (
      this.destroyRef.destroyed || !this.platform.isBrowser || this.generating() ||
      snapshot.status !== 'ready' || snapshot.template.template_id !== submission.templateId
    ) {
      return;
    }

    this.clearGeneration();
    const entries = Object.entries(submission.fields);
    if (!entries.some(([, { value }]) => typeof value === 'boolean' || value.trim() !== '')) {
      this.generationState.set({ status: 'missing-data' });
      return;
    }

    const missingFonts: FieldIssue[] = [];
    for (const [fieldId, { value, label }] of entries) {
      const field = snapshot.fieldMap.fields[fieldId];
      if (field?.kind === 'text' && typeof value === 'string' && value.trim() !== '' &&
          !submission.fontFiles.get(field.font.family)?.byteLength) {
        missingFonts.push({ fieldId, label, code: 'invalid-font' });
      }
    }
    if (missingFonts.length > 0) {
      this.generationState.set({ status: 'invalid-fields', errors: missingFonts });
      return;
    }

    this.generationState.set({ status: 'generating' });
    const values = Object.fromEntries(entries.map(([id, { value }]) => [id, value]));
    try {
      const result = await this.filler.fill(snapshot, values, submission.fontFiles);
      if (this.destroyRef.destroyed || this.template() !== snapshot) return;

      if (result.status === 'invalid-fields') {
        const errors = result.errors.map((error) => ({ ...error, label: submission.fields[error.fieldId].label }));
        this.generationState.set({ status: 'invalid-fields', errors });
        return;
      }

      const pdf = new Blob([Uint8Array.from(result.pdfBytes)], { type: CONTRACT_TEMPLATE_PDF_MIME });
      this.generationState.set({ status: 'filled', pdf });
    } catch {
      if (!this.destroyRef.destroyed && this.template() === snapshot) {
        this.generationState.set({ status: 'failed' });
      }
    }
  }

  openPreview(): void {
    const result = this.generation();
    if (!this.platform.isBrowser || result.status !== 'filled' || this.preview() !== null) return;
    this.activePreview.set({ url: URL.createObjectURL(result.pdf), title: CONTRACT_FILENAME });
  }

  closePreview(): void {
    const preview = this.preview();
    if (preview === null) return;
    this.activePreview.set(null);
    URL.revokeObjectURL(preview.url);
  }

  download(): void {
    const result = this.generation();
    if (result.status === 'filled') this.platform.downloadBlob(result.pdf, CONTRACT_FILENAME);
  }

  private clearGeneration(): void {
    this.closePreview();
    this.generationState.set({ status: 'idle' });
  }
}
