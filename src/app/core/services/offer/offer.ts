import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Supabase } from '../supabase/supabase';
import { toCamelCase } from '../../utils/type-mappings';
import type {
  OfferItem,
  OfferPage,
  OfferPageDbRow,
  OfferPageSection,
  OfferPageVm,
  OfferSectionItem,
  OfferSectionWithItems,
} from '../../types/offers';

@Injectable({ providedIn: 'root' })
export class Offer {
  private readonly supabase = inject(Supabase).client();

  getOfferPageVmBySlug(slug: string): Observable<OfferPageVm | null> {
    const query = this.supabase
      .from('offer_pages')
      .select(
        `
        *,
        offer_page_sections (
          *,
          offer_page_section_items (
            *,
            offer_items (*)
          )
        )
      `,
      )
      .eq('slug', slug)
      .maybeSingle();

    return from(query).pipe(
      map((res) => {
        if (res.error) {
          throw new Error(res.error.message);
        }

        if (!res.data) {
          return null;
        }

        const raw = toCamelCase<OfferPageDbRow>(res.data);

        const sections: OfferSectionWithItems[] = (raw.offerPageSections ?? [])
          .filter((section) => section.isActive)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((section) => {
            const items = (section.offerPageSectionItems ?? [])
              .slice()
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((link) => link.offerItems)
              .filter(Boolean) as OfferItem[];

            return {
              ...section,
              items,
            };
          });

        const { offerPageSections, ...page } = raw;

        return {
          page,
          sections,
        };
      }),
    );
  }
}
