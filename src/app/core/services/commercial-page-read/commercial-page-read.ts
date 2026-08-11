import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  COMMERCIAL_PAGE_DEFAULT_LOCALE,
  COMMERCIAL_PAGE_RPC,
} from '../../configs/commercial-pages.config';
import type {
  CommercialPageBuilderDocument,
} from '../../types/commercial-page-builder';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class CommercialPageRead {
  private readonly backend = inject(Backend);

  getBySlug(
    slug: string,
    locale = COMMERCIAL_PAGE_DEFAULT_LOCALE,
  ): Observable<CommercialPageBuilderDocument | null> {
    return this.backend.rpc<CommercialPageBuilderDocument | null>(
      COMMERCIAL_PAGE_RPC.getPublicBySlug,
      { p_slug: slug, p_locale: locale },
    );
  }
}
