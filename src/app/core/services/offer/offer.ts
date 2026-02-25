import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { Backend } from '../backend/backend';
import { OfferItem, OfferPage, OfferPageSection, OfferPageVm, OfferSectionItem } from '../../types/offers';
import { FilterOperator } from '../../enums/filter-operators';

@Injectable({ providedIn: 'root' })
export class Offer {
  private readonly backend = inject(Backend);

  getOfferPageVmBySlug(slug: string): Observable<OfferPageVm | null> {
    return this.backend.getBySlug<OfferPage>('offer_pages', slug).pipe(
      switchMap((page) => {
        if (!page) return of(null);
       
        return this.backend.getAll<OfferPageSection>({
          table: 'offer_page_sections',
          sortBy: 'position',
          sortOrder: 'asc',
          pagination: {
            filters: {
              offerPageId: { operator: FilterOperator.EQ, value: page.id },
              isActive: { operator: FilterOperator.EQ, value: true },
            },
          },
        }).pipe(
          switchMap((sections) => {
            if (!sections.length) return of({ page, sections: [] });

            const sectionIds = sections.map((s) => s.id);

            return this.backend.getAll<OfferSectionItem>({
              table: 'offer_page_section_items',
              sortBy: 'position',
              sortOrder: 'asc',
              pagination: {
                filters: {
                  sectionId: { operator: FilterOperator.IN, value: sectionIds },
                },
              },
            }).pipe(
              switchMap((links) => {
                const itemIds = [...new Set(links.map((l) => l.offerItemId))];
                if (!itemIds.length) {
                  return of({
                    page,
                    sections: sections.map((s) => ({ ...s, items: [] })),
                  });
                }

                // 3) pobierz itemy
                return this.backend.getByIds<OfferItem>('offer_items', itemIds).pipe(
                  map((items) => {
                    const itemsById = new Map(items.map((it) => [it.id, it]));

                    const linksBySection = new Map<string, OfferSectionItem[]>();
                    for (const l of links) {
                      const arr = linksBySection.get(l.sectionId) ?? [];
                      arr.push(l);
                      linksBySection.set(l.sectionId, arr);
                    }

                    const sectionsVm = sections
                      .slice()
                      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                      .map((s) => {
                        const ls = (linksBySection.get(s.id) ?? []).slice().sort((a, b) => a.position - b.position);
                        const sectionItems = ls
                          .map((x) => itemsById.get(x.offerItemId))
                          .filter(Boolean) as OfferItem[];

                        return { ...s, items: sectionItems };
                      });

                    return { page, sections: sectionsVm };
                  }),
                );
              }),
            );
          }),
        );
      }),
    );
  }
}
