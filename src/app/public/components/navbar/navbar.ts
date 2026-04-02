import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  OutputEmitterRef,
  Type,
  ViewContainerRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { DrawerModule } from 'primeng/drawer';
import { Popover, PopoverModule } from 'primeng/popover';

import { provideTranslocoScope } from '@jsverse/transloco';

import { AuthSession } from '../../../core/services/auth-session/auth-session';
import { LazyComponentLoader } from '../../../core/services/lazy-component-loader/lazy-component-loader';
import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { CommonNavMenuItem } from '../../../core/types/i18n/common';
import { ThemeSwitch } from '../../common/theme-switch/theme-switch';
import { createNavbarI18n } from './navbar.i18n';

interface CloseableOverlayComponent {
  closed: OutputEmitterRef<void>;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgOptimizedImage,
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
  private readonly lazyComponentLoader = inject(LazyComponentLoader);
  private readonly nav = inject(Navigation);
  private readonly uiConfirm = inject(UiConfirm);

  readonly theme = inject(Theme);
  readonly i18n = createNavbarI18n();

  readonly menu = computed(() => this.i18n.resolveMenu(this.nav.navbar()));
  readonly isAuthenticated = computed(() =>
    this.authSession.isAuthenticated(),
  );

  readonly mobileOpen = signal(false);
  readonly activeDropdown = signal<CommonNavMenuItem | null>(null);
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
  private readonly loadUserMenuPanel = () =>
    import('../../../auth/components/user-menu-panel/user-menu-panel').then(
      ({ UserMenuPanel }) => UserMenuPanel as Type<CloseableOverlayComponent>,
    );

  openDropdown(event: Event, item: CommonNavMenuItem): void {
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

  openUserMenu(event: Event): void {
    this.closeDropdown();

    if (this.isUserMenuLoaded()) {
      this.userPopover()?.toggle(event);
      return;
    }

    if (this.isUserMenuLoading()) {
      return;
    }

    this.mountUserMenu(event);
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

  private mountUserMenu(event: Event): void {
    const host = this.userMenuHost();
    if (!host) {
      return;
    }

    this.isUserMenuLoading.set(true);

    this.lazyComponentLoader
      .mount({
        host,
        load: this.loadUserMenuPanel,
        onMount: (componentRef) => {
          componentRef.instance.closed.subscribe(() => {
            this.closeUserMenu();
          });
        },
      })
      .pipe(
        finalize(() => {
          this.isUserMenuLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.isUserMenuLoaded.set(true);
          this.userPopover()?.toggle(event);
        },
      });
  }

  trackByLabelKey = (_: number, item: CommonNavMenuItem) => item.labelKey;
}
