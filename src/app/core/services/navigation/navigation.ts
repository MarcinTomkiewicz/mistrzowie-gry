import { Injectable, computed, signal } from '@angular/core';

import { MENU_CONFIG } from '../../configs/menu.config';
import { SOCIAL_LINKS } from '../../configs/social.config';
import { LEGAL_LINKS } from '../../configs/legal.config';

import { IMenu } from '../../interfaces/i-menu';
import { ISocialLink } from '../../interfaces/i-socials';
import { ILegalLink } from '../../interfaces/i-legal';

@Injectable({ providedIn: 'root' })
export class Navigation {
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

  /* ========= FUTURE EXTENSIONS ========= */

  // setMenuFromCms(data: IMenu[]) { this.menuSource.set(data); }
  // applyPermissions(roles: string[]) { ... }
}