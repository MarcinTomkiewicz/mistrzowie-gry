import { inject, Injectable } from '@angular/core';
import { defer, finalize, firstValueFrom, from, map, type Observable, of, switchMap } from 'rxjs';

import { getConfigurationIssues, isContractConfiguration, type ConfigurationMode, type ContractPage } from '../../types/contract-template-configuration';
import { openStaticContractPdf } from '../../utils/contract-pdf-geometry';
import { assertEdgeContract } from '../../utils/edge-contract';
import { loadPdfDocument } from '../../utils/pdf';
import { Platform } from '../platform/platform';
import type { ContractConfiguration, ContractTemplate } from './admin-contract-templates.contract';
import { AdminContractTemplates } from './admin-contract-templates';

export type VerifiedContractTemplate = {
  readonly template: ContractTemplate;
  readonly revision: ContractConfiguration;
  readonly pdfBytes: ArrayBuffer;
  readonly pages: ContractPage[];
};
export type CatalogContractTemplate = {
  readonly revision: ContractConfiguration;
  readonly document: VerifiedContractTemplate | null;
};
export type ContractTemplateLoadResult =
  | { readonly status: 'no-active-template' }
  | { readonly status: 'invalid-configuration' }
  | { readonly status: 'ready'; readonly snapshot: VerifiedContractTemplate };

export function hasCompleteConfiguration(snapshot: VerifiedContractTemplate): boolean {
  const config = snapshot.revision.configuration;
  return isContractConfiguration(config) && getConfigurationIssues(config).length === 0 &&
    config.pages.length === snapshot.pages.length && config.pages.every((page, index) =>
      page.width === snapshot.pages[index].width && page.height === snapshot.pages[index].height);
}

@Injectable({ providedIn: 'root' })
export class ContractTemplateLibrary {
  private readonly templates = inject(AdminContractTemplates);
  private readonly platform = inject(Platform);

  loadActive(family: string): Observable<ContractTemplateLoadResult> {
    return defer(() => {
      this.requireBrowser();
      return this.templates.list().pipe(switchMap((templates) => {
        const template = templates.find((row) => row.family === family && row.status === 'active');
        if (template === undefined) return of({ status: 'no-active-template' } as const);
        return this.templates.getConfiguration(template.template_id, 'generator').pipe(
          switchMap((revision) => this.readSnapshot(template, revision, 'generator')),
          map((snapshot) => hasCompleteConfiguration(snapshot)
              ? { status: 'ready', snapshot } as const
              : { status: 'invalid-configuration' } as const),
        );
      }));
    });
  }

  loadCatalog(template: ContractTemplate): Observable<CatalogContractTemplate> {
    return defer(() => {
      this.requireBrowser();
      return this.templates.getConfiguration(template.template_id, 'catalog').pipe(
        switchMap((revision) => {
          this.assertIdentity(template, revision);
          return revision.status === 'retired' ? of({ revision, document: null }) :
            this.readSnapshot(template, revision, 'catalog').pipe(map((document) => ({ revision, document })));
        }),
      );
    });
  }

  private readSnapshot(
    template: ContractTemplate,
    revision: ContractConfiguration,
    mode: ConfigurationMode,
  ): Observable<VerifiedContractTemplate> {
    this.assertIdentity(template, revision);
    return this.templates.downloadPdf(template.template_id, mode === 'generator' ? 'active_template' : 'template')
      .pipe(switchMap(({ blob }) => {
        const controller = new AbortController();
        return from(this.verifyBytes(template, revision, blob, controller.signal)).pipe(
          finalize(() => controller.abort()),
        );
      }));
  }

  private assertIdentity(template: ContractTemplate, revision: ContractConfiguration): void {
    assertEdgeContract(template.template_id === revision.template_id && template.family === revision.family &&
      template.status === revision.status && template.pdf_sha256 === revision.pdf_sha256,
    'template', 'the same catalog identity and status');
  }

  private async verifyBytes(template: ContractTemplate, revision: ContractConfiguration, blob: Blob, signal: AbortSignal) {
    assertEdgeContract(blob.size === template.size_bytes, 'template.size_bytes', 'the downloaded PDF size');
    const pdfBytes = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', pdfBytes);
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    assertEdgeContract(hash === revision.pdf_sha256, 'template.pdf_sha256', 'the downloaded PDF digest');
    const { areas } = await openStaticContractPdf(pdfBytes);
    signal.throwIfAborted();
    const { document, pageCount } = await firstValueFrom(loadPdfDocument(new Uint8Array(pdfBytes.slice(0)), signal));
    assertEdgeContract(pageCount === areas.length, 'pages', 'the verified PDF page count');
    for (const [index, area] of areas.entries()) {
      const page = await document.getPage(index + 1);
      const [left, bottom, right, top] = page.view;
      assertEdgeContract(page.rotate % 360 === 0 && page.userUnit === 1 &&
        left === area.x && bottom === area.y && right - left === area.width && top - bottom === area.height,
      'pages', 'matching PDF reader and writer geometry');
    }
    const pages = areas.map(({ width, height }) => ({ width, height }));
    return { template, revision, pdfBytes, pages };
  }

  private requireBrowser(): void {
    if (!this.platform.isBrowser) throw new Error('Contract templates are available in the browser.');
  }
}
