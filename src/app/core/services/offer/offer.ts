import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type { OfferPageVm } from '../../types/offers';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class Offer {
  private readonly backend = inject(Backend);

  getOfferPageVmBySlug(slug: string): Observable<OfferPageVm | null> {
    return this.backend.rpc<OfferPageVm | null>(
      'get_public_offer_page_by_slug',
      { p_slug: slug },
    );
  }
}
