import { Injectable, computed, signal } from '@angular/core';
import { IMenu } from '../../interfaces/i-menu';
import { MENU_CONFIG } from '../../configs/menu.config';
import { SOCIAL_LINKS } from '../../configs/social.config';
import { LEGAL_LINKS } from '../../configs/legal.config';


@Injectable({ providedIn: 'root' })
export class Navigation {
  /* ========= BASE DATA ========= */

  private readonly menuSource = signal<IMenu[]>(MENU_CONFIG);

  /* ========= PUBLIC SIGNALS ========= */

  /** pełne menu (navbar) */
  readonly navbar = computed(() => this.menuSource());

  /** elementy footera (kontrolowane flagą footer) */
  readonly footer = computed<IMenu[]>(() => {
    const out: IMenu[] = [];

    const walk = (items: IMenu[]) => {
      for (const i of items) {
        if (i.footer && i.path && !i.disabled) {
          out.push(i);
        }
        if (i.children?.length) {
          walk(i.children);
        }
      }
    };

    walk(this.menuSource());
    return out;
  });

  /** social links */
  readonly social = signal(SOCIAL_LINKS);

  /** legal links */
  readonly legal = signal(LEGAL_LINKS);

  /* ========= FUTURE EXTENSIONS ========= */

  // setMenuFromCms(data: IMenu[]) { this.menuSource.set(data); }
  // applyPermissions(roles: string[]) { ... }
}
