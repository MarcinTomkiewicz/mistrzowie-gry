import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  COMMERCIAL_PAGE_DEFAULT_LOCALE,
  COMMERCIAL_PAGE_RPC,
} from '../../configs/commercial-pages.config';
import type {
  CommercialPageAdminDetail,
  CommercialPageAdminListItem,
  CommercialPagePublicationIssue,
  CommercialPagePublishResult,
} from '../../types/commercial-page-admin';
import type {
  CommercialPageDocument,
  StoredCommercialPageDocument,
} from '../../types/commercial-page';
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
    document: StoredCommercialPageDocument,
    locale = COMMERCIAL_PAGE_DEFAULT_LOCALE,
  ): Observable<CommercialPageAdminDetail> {
    return this.backend.rpc<CommercialPageAdminDetail>(
      COMMERCIAL_PAGE_RPC.saveAdminDraft,
      { p_page_id: pageId, p_locale: locale, p_document: document },
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
