import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  COMMERCIAL_PAGE_DEFAULT_LOCALE,
  COMMERCIAL_PAGE_RPC,
} from '../../configs/commercial-pages.config';
import type {
  CommercialPageAdminDetail,
  CommercialPageAdminDocument,
  CommercialPageAdminListItem,
  CommercialPageAdminSavePayload,
  CommercialPageAdminUnsavedPreviewPayload,
  CommercialPagePublicationIssue,
  CommercialPagePublishResult,
} from '../../types/commercial-page-admin';
import type { CommercialPageDocument } from '../../types/commercial-page';
import type {
  CommercialPageBuilderDocument,
  CommercialPageEditorDocument,
} from '../../types/commercial-page-builder';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class CommercialPageAdmin {
  private readonly backend = inject(Backend);

  getList(): Observable<CommercialPageAdminListItem[]> {
    return this.backend.rpc<CommercialPageAdminListItem[]>(
      COMMERCIAL_PAGE_RPC.getAdminList,
    );
  }

  getDetail(
    pageId: string,
    locale = COMMERCIAL_PAGE_DEFAULT_LOCALE,
  ): Observable<CommercialPageAdminDetail> {
    return this.backend.rpc<CommercialPageAdminDetail>(
      COMMERCIAL_PAGE_RPC.getAdminDetail,
      { p_page_id: pageId, p_locale: locale },
    );
  }

  saveDraft(
    pageId: string,
    document: CommercialPageAdminDocument,
    locale = COMMERCIAL_PAGE_DEFAULT_LOCALE,
  ): Observable<CommercialPageAdminDetail> {
    const payload = {
      p_page_id: pageId,
      p_locale: locale,
      p_document: document,
    } satisfies CommercialPageAdminSavePayload;

    return this.backend.rpc<CommercialPageAdminDetail>(
      COMMERCIAL_PAGE_RPC.saveAdminDraft,
      payload,
    );
  }

  validateDraft(
    pageId: string,
    locale = COMMERCIAL_PAGE_DEFAULT_LOCALE,
  ): Observable<CommercialPagePublicationIssue[]> {
    return this.backend.rpc<CommercialPagePublicationIssue[]>(
      COMMERCIAL_PAGE_RPC.validateAdminDraft,
      { p_page_id: pageId, p_locale: locale },
    );
  }

  getPreview(
    pageId: string,
    locale = COMMERCIAL_PAGE_DEFAULT_LOCALE,
  ): Observable<CommercialPageDocument> {
    return this.backend.rpc<CommercialPageDocument>(
      COMMERCIAL_PAGE_RPC.getAdminPreview,
      { p_page_id: pageId, p_locale: locale },
    );
  }

  getUnsavedPreview(
    pageId: string,
    document: CommercialPageEditorDocument,
    locale = COMMERCIAL_PAGE_DEFAULT_LOCALE,
  ): Observable<CommercialPageBuilderDocument> {
    const payload = {
      p_page_id: pageId,
      p_locale: locale,
      p_document: document,
    } satisfies CommercialPageAdminUnsavedPreviewPayload;

    return this.backend.rpc<CommercialPageBuilderDocument>(
      COMMERCIAL_PAGE_RPC.getAdminUnsavedPreview,
      payload,
    );
  }

  publish(
    pageId: string,
    effectiveFrom: string,
    locale = COMMERCIAL_PAGE_DEFAULT_LOCALE,
  ): Observable<CommercialPagePublishResult> {
    return this.backend.rpc<CommercialPagePublishResult>(
      COMMERCIAL_PAGE_RPC.publishAdmin,
      {
        p_page_id: pageId,
        p_locale: locale,
        p_effective_from: effectiveFrom,
      },
    );
  }
}
