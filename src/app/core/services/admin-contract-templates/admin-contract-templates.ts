import { inject, Injectable } from '@angular/core';
import { finalize, from, map, switchMap } from 'rxjs';

import { CONTRACT_TEMPLATE_PDF_PATH_PREFIX } from '../../configs/admin-contract-templates.config';
import type { EdgeReader } from '../../types/edge-contract';
import {
  type ConfigurationMode, type ContractPage, type ContractTemplateConfiguration, trimContractFamilyLabel,
} from '../../types/contract-template-configuration';
import { assertEdgeContract } from '../../utils/edge-contract';
import { isRecord } from '../../utils/is-record';
import { fetchPrivatePdf } from '../../utils/private-pdf';
import { Backend } from '../backend/backend';
import {
  type ContractTemplateUpload,
  type ContractConfiguration,
  type ContractFamily,
  readActiveTemplate,
  readConfiguration,
  readDeletedTemplate,
  readFamilies,
  readFamily,
  readStagedTemplate,
  readTemplateDownload,
  readTemplates,
} from './admin-contract-templates.contract';

type ContractTemplateArtifact = 'template' | 'active_template';
type FamilyWrite = { family: string; label: string } & (
  { action: 'createFamily' } | { action: 'renameFamily'; expected_label: string }
);

@Injectable({ providedIn: 'root' })
export class AdminContractTemplates {
  private readonly backend = inject(Backend);

  list() {
    return this.invoke({ action: 'listTemplates' }, readTemplates);
  }

  listFamilies() {
    return this.invoke({ action: 'listFamilies' }, readFamilies);
  }

  createFamily(family: string, label: string) {
    return this.writeFamily({ action: 'createFamily', family, label });
  }

  renameFamily(current: ContractFamily, label: string) {
    return this.writeFamily({
      action: 'renameFamily',
      family: current.family,
      expected_label: current.label,
      label: trimContractFamilyLabel(label),
    });
  }

  getConfiguration(templateId: string, mode: ConfigurationMode) {
    return this.invoke({ action: 'getTemplateConfiguration', template_id: templateId, mode }, readConfiguration)
      .pipe(map((row) => {
        assertEdgeContract(row.template_id === templateId &&
          (mode === 'catalog' || (row.status === 'active' && row.configuration !== null)),
        'response.data', 'the requested template configuration');
        return row;
      }));
  }

  saveConfiguration(target: ContractConfiguration, configuration: ContractTemplateConfiguration) {
    return this.changeConfiguration(target, { action: 'saveTemplateConfiguration', configuration });
  }

  copyConfiguration(target: ContractConfiguration, source: ContractConfiguration, pages: ContractPage[]) {
    return this.changeConfiguration(target, {
      action: 'copyTemplateConfiguration',
      source_template_id: source.template_id,
      source_revision: source.configuration_revision,
      pages,
    });
  }

  reassignTemplate(snapshot: ContractConfiguration, targetFamily: string) {
    return this.invoke({
      action: 'reassignTemplate',
      ...this.revisionArgs(snapshot),
      expected_family: snapshot.family,
      target_family: targetFamily,
    }, readConfiguration).pipe(map((row) => {
      assertEdgeContract(row.template_id === snapshot.template_id && row.family === targetFamily &&
        row.status === 'staged' && row.pdf_sha256 === snapshot.pdf_sha256 &&
        row.configuration_revision === snapshot.configuration_revision + 1 &&
        row.configuration_updated_at === snapshot.configuration_updated_at &&
        equalJson(row.configuration, snapshot.configuration),
      'response.data', 'the reassigned template with its configuration preserved');
      return row;
    }));
  }

  upload({ family, file }: ContractTemplateUpload) {
    const body = new FormData();
    body.append('action', 'uploadTemplate');
    body.append('family', family);
    body.append('file', file);
    return this.invoke(body, readStagedTemplate).pipe(map((result) => {
      assertEdgeContract(result.family === family, 'response.data.family', 'the requested family');
      return result;
    }));
  }

  approve(target: ContractConfiguration, confirmPreview: boolean) {
    return this.invoke({
      action: 'approveTemplate',
      ...this.revisionArgs(target),
      confirm_preview: confirmPreview,
    }, readActiveTemplate).pipe(map((result) => {
      assertEdgeContract(result.template_id === target.template_id && result.family === target.family,
        'response.data', 'the approved template');
      return result;
    }));
  }

  private changeConfiguration(target: ContractConfiguration, request: object) {
    return this.invoke({ ...request, ...this.revisionArgs(target) }, readConfiguration).pipe(map((row) => {
      assertEdgeContract(row.template_id === target.template_id && row.family === target.family &&
        row.pdf_sha256 === target.pdf_sha256 && row.status === 'staged' && row.configuration !== null &&
        row.configuration_revision === target.configuration_revision + 1,
      'response.data', 'the next configuration revision');
      return row;
    }));
  }

  private revisionArgs(target: ContractConfiguration) {
    return {
      template_id: target.template_id,
      pdf_sha256: target.pdf_sha256,
      expected_revision: target.configuration_revision,
    };
  }

  deleteTemplate(templateId: string, confirmActive: boolean) {
    return this.invoke({
      action: 'deleteTemplate',
      template_id: templateId,
      confirm_active: confirmActive,
    }, readDeletedTemplate).pipe(map((result) => {
      assertEdgeContract(result.template_id === templateId, 'response.data.template_id', 'the requested template');
      return result;
    }));
  }

  getDownloadUrl(templateId: string, artifactType: ContractTemplateArtifact = 'template') {
    return this.invoke({
      action: 'getDownloadUrl',
      artifact_type: artifactType,
      artifact_id: templateId,
    }, readTemplateDownload);
  }

  downloadPdf(templateId: string, artifactType: ContractTemplateArtifact = 'template') {
    return this.getDownloadUrl(templateId, artifactType).pipe(switchMap(({ url, filename }) => {
      const controller = new AbortController();
      return from(fetchPrivatePdf(url, CONTRACT_TEMPLATE_PDF_PATH_PREFIX, controller.signal)).pipe(
        map((blob) => ({ blob, filename })),
        finalize(() => controller.abort()),
      );
    }));
  }

  private writeFamily(request: FamilyWrite) {
    return this.invoke(request, readFamily).pipe(map((result) => {
      assertEdgeContract(result.family === request.family && result.label === request.label,
        'response.data', 'the requested family key and label');
      return result;
    }));
  }

  private invoke<TResult, TBody>(body: TBody, reader: EdgeReader<TResult>) {
    return this.backend.invokeEdgeParsed('admin-client-contracts', { method: 'POST', body }, reader);
  }
}

function equalJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left)) {
    return Array.isArray(right) && left.length === right.length &&
      left.every((value, index) => equalJson(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length &&
    keys.every((key) => Object.hasOwn(right, key) && equalJson(left[key], right[key]));
}
