import { inject, Injectable } from '@angular/core';
import { defer, type Observable, of, switchMap } from 'rxjs';

import type { ContractTemplateFamily } from '../../configs/admin-contract-templates.config';
import { CONTRACT_TEMPLATE_FIELD_MAPS } from '../../configs/contract-template-field-maps.config';
import type { ContractTemplateFieldMap } from '../../types/contract-template-field-map';
import { assertEdgeContract } from '../../utils/edge-contract';
import { Platform } from '../platform/platform';
import type { ContractTemplate } from './admin-contract-templates.contract';
import { AdminContractTemplates } from './admin-contract-templates';

export type ContractTemplateLoadResult =
  | { readonly status: 'no-active-template' }
  | { readonly status: 'field-map-missing'; readonly template: ContractTemplate }
  | {
      readonly status: 'ready';
      readonly template: ContractTemplate;
      readonly pdfBytes: ArrayBuffer;
      readonly fieldMap: ContractTemplateFieldMap;
    };

@Injectable({ providedIn: 'root' })
export class ContractTemplateLibrary {
  private readonly templates = inject(AdminContractTemplates);
  private readonly platform = inject(Platform);

  loadActive(family: ContractTemplateFamily): Observable<ContractTemplateLoadResult> {
    return defer(() => {
      if (!this.platform.isBrowser) {
        throw new Error('Active contract templates can only be loaded in the browser.');
      }

      return this.templates.list().pipe(switchMap((templates) => {
        const template = templates.find((row) => row.family === family && row.status === 'active');
        if (template === undefined) return of({ status: 'no-active-template' } as const);

        return this.templates.downloadPdf(template.template_id, 'active_template').pipe(
          switchMap(({ blob }) => this.readSnapshot(template, blob)),
        );
      }));
    });
  }

  private async readSnapshot(template: ContractTemplate, blob: Blob): Promise<ContractTemplateLoadResult> {
    assertEdgeContract(blob.size === template.size_bytes, 'template.size_bytes', 'the downloaded PDF size');
    const pdfBytes = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', pdfBytes);
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    assertEdgeContract(hash === template.pdf_sha256, 'template.pdf_sha256', 'the downloaded PDF digest');

    const fieldMap = CONTRACT_TEMPLATE_FIELD_MAPS.find((map) =>
      map.family === template.family && map.pdfSha256 === hash);
    if (fieldMap === undefined) return { status: 'field-map-missing', template };

    return { status: 'ready', template, pdfBytes, fieldMap };
  }
}
