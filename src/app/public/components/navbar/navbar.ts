import {
  Component,
  Type,
  ViewContainerRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { DrawerModule } from 'primeng/drawer';
import { Popover, PopoverModule } from 'primeng/popover';

import { provideTranslocoScope } from '@jsverse/transloco';

import { AuthSession } from '../../../core/services/auth-session/auth-session';
import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { ThemeSwitch } from '../../common/theme-switch/theme-switch';
import { createNavbarI18n, UIMenu } from './navbar.i18n';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    PopoverModule,
    DrawerModule,
    ThemeSwitch,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  providers: [provideTranslocoScope('common')],
})
export class Navbar {
  private readonly authSession = inject(AuthSession);
  private readonly nav = inject(Navigation);
  private readonly uiConfirm = inject(UiConfirm);

  readonly theme = inject(Theme);
  readonly i18n = createNavbarI18n();

  readonly menu = computed(() => this.i18n.resolveMenu(this.nav.navbar()));
  readonly isAuthenticated = computed(() =>
    this.authSession.isAuthenticated(),
  );

  readonly mobileOpen = signal(false);
  readonly activeDropdown = signal<UIMenu | null>(null);
  readonly isUserMenuLoading = signal(false);
  readonly isUserMenuLoaded = signal(false);

  readonly activeChildren = computed(
    () => this.activeDropdown()?.children ?? [],
  );

  readonly brandLogoSrc = this.theme.brandLogoSrc;

  private readonly navPopover = viewChild<Popover>('navPopover');
  private readonly userPopover = viewChild<Popover>('userPopover');
  private readonly userMenuHost = viewChild('userMenuHost', {
    read: ViewContainerRef,
  });

  openDropdown(event: Event, item: UIMenu): void {
    if (!item.children?.length) return;

    if (this.activeDropdown()?.labelKey === item.labelKey) {
      this.closeDropdown();
      return;
    }

    this.closeUserMenu();
    this.activeDropdown.set(item);
    this.navPopover()?.show(event);
  }

  closeDropdown(): void {
    this.navPopover()?.hide();
    this.activeDropdown.set(null);
  }

  async openUserMenu(event: Event): Promise<void> {
    this.closeDropdown();
    await this.ensureUserMenuLoaded();
    this.userPopover()?.toggle(event);
  }

  closeUserMenu(): void {
    this.userPopover()?.hide();
  }

  openMobile(): void {
    this.closeDropdown();
    this.closeUserMenu();
    this.mobileOpen.set(true);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  onMobileNavigate(): void {
    this.closeMobile();
  }

  showOutOfOrderPopup(event: Event): void {
    this.uiConfirm.info(event, {
      message: this.i18n.info().outOfOrder,
      acceptLabel: this.i18n.actions().ok,
    });
  }

  private async ensureUserMenuLoaded(): Promise<void> {
    if (this.isUserMenuLoaded()) {
      return;
    }

    const host = this.userMenuHost();
    if (!host) {
      return;
    }

    this.isUserMenuLoading.set(true);

    try {
      const { UserMenuPanel } = await import(
        '../../../auth/components/user-menu-panel/user-menu-panel'
      );

      host.clear();

      const componentRef = host.createComponent(
        UserMenuPanel as Type<unknown>,
      );

      const instance = componentRef.instance as {
        closed?: { subscribe: (cb: () => void) => { unsubscribe(): void } };
      };

      instance.closed?.subscribe(() => {
        this.closeUserMenu();
      });

      this.isUserMenuLoaded.set(true);
    } finally {
      this.isUserMenuLoading.set(false);
    }
  }

  trackByLabelKey = (_: number, item: UIMenu) => item.labelKey;
}
