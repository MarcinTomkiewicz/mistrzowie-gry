import {
  DestroyRef,
  ErrorHandler,
  Injectable,
  TransferState,
  computed,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { MENU_CONFIG } from '../../configs/menu.config';
import { SOCIAL_LINKS } from '../../configs/social.config';
import { LEGAL_LINKS } from '../../configs/legal.config';

import { IMenu } from '../../interfaces/i-menu';
import { ISocialLink } from '../../interfaces/i-socials';
import { ILegalLink } from '../../interfaces/i-legal';
import type { PublicCommercialPageNavItem } from '../../types/commercial-page';
import { CommercialPageRead } from '../commercial-page-read/commercial-page-read';
import { Platform } from '../platform/platform';

const PUBLIC_COMMERCIAL_NAV_STATE = makeStateKey<PublicCommercialPageNavItem[]>(
  'public-commercial-page-nav',
);

@Injectable({ providedIn: 'root' })
export class Navigation {
  private readonly pages = inject(CommercialPageRead);
  private readonly platform = inject(Platform);
  private readonly transferState = inject(TransferState);
  private readonly errorHandler = inject(ErrorHandler);
  private publicNavRequest: Subscription | null = null;
  /* ========= BASE DATA ========= */

  private readonly menuSource = signal<IMenu[]>(MENU_CONFIG);
  private readonly socialSource = signal<ISocialLink[]>(SOCIAL_LINKS);
  private readonly legalSource = signal<ILegalLink[]>(LEGAL_LINKS);

  /* ========= PUBLIC SIGNALS ========= */

  /** pełne menu (navbar) */
  readonly navbar = computed(() => this.menuSource());

  /** elementy footera (kontrolowane flagą footer) */
  readonly footer = computed<IMenu[]>(() => {
    const out: IMenu[] = [];

    const walk = (items: IMenu[]) => {
      for (const item of items) {
        if (item.footer && item.path && !item.disabled) {
          out.push(item);
        }

        if (item.children?.length) {
          walk(item.children);
        }
      }
    };

    walk(this.menuSource());
    return out;
  });

  /** social links */
  readonly social = computed(() => this.socialSource());

  /** legal links */
  readonly legal = computed(() => this.legalSource());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.publicNavRequest?.unsubscribe());

    if (
      this.platform.isBrowser &&
      this.transferState.hasKey(PUBLIC_COMMERCIAL_NAV_STATE)
    ) {
      this.applyCommercialPages(this.transferState.get(PUBLIC_COMMERCIAL_NAV_STATE, []));
      this.transferState.remove(PUBLIC_COMMERCIAL_NAV_STATE);
    } else {
      this.refreshCommercialPages();
    }
  }

  refreshCommercialPages(): void {
    this.publicNavRequest?.unsubscribe();
    this.publicNavRequest = this.pages.getList().subscribe({
      next: (pages) => {
        this.applyCommercialPages(pages);
        if (!this.platform.isBrowser) {
          this.transferState.set(PUBLIC_COMMERCIAL_NAV_STATE, pages);
        }
      },
      error: (error: unknown) => {
        this.setOfferChildren(
          MENU_CONFIG.find((item) => item.labelKey === 'nav.offer')?.children,
        );
        this.errorHandler.handleError(error);
      },
    });
  }

  private applyCommercialPages(pages: PublicCommercialPageNavItem[]): void {
    this.setOfferChildren(pages.map((page) => ({
      label: page.menuLabel ?? page.heading,
      path: `/offer/${page.slug}`,
      footer: true,
    })));
  }

  private setOfferChildren(children: IMenu[] | undefined): void {
    this.menuSource.update((menu) => menu.map((item) =>
      item.labelKey === 'nav.offer' ? { ...item, children } : item,
    ));
  }
}
