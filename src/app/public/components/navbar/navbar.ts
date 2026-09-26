import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  ComponentRef,
  OutputEmitterRef,
  Type,
  ViewContainerRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { DrawerModule } from 'primeng/drawer';
import { Popover, PopoverModule } from 'primeng/popover';

import { provideTranslocoScope } from '@jsverse/transloco';

import type { NotificationPanel } from '../../../auth/components/notification-panel/notification-panel';
import { NotificationFacade } from '../../../core/facades/notifications/notification-facade';
import { Auth } from '../../../core/services/auth/auth';
import { AuthSession } from '../../../core/services/auth-session/auth-session';
import { LazyComponentLoader } from '../../../core/services/lazy-component-loader/lazy-component-loader';
import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { CommonNavMenuItem } from '../../../core/types/i18n/common';
import {
  createNotificationsI18n,
  NOTIFICATIONS_SCOPE,
} from '../../../core/translations/notifications.i18n';
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
    RouterLink,
    PopoverModule,
    DrawerModule,
    ThemeSwitch,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  providers: [provideTranslocoScope('common', NOTIFICATIONS_SCOPE)],
})
export class Navbar {
  private readonly auth = inject(Auth);
  private readonly authSession = inject(AuthSession);
  private readonly lazyComponentLoader = inject(LazyComponentLoader);
  private readonly nav = inject(Navigation);
  private readonly theme = inject(Theme);
  private readonly uiConfirm = inject(UiConfirm);

  readonly i18n = createNavbarI18n();
  readonly notificationI18n = createNotificationsI18n();
  readonly notifications = inject(NotificationFacade);
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly menu = computed(() => this.i18n.resolveMenu(this.nav.navbar()));
  readonly hasSessionCookie = this.authSession.hasSessionCookie;

  readonly mobileOpen = signal(false);
  readonly activeDropdown = signal<CommonNavMenuItem | null>(null);
  readonly isUserMenuLoading = signal(false);
  readonly isUserMenuLoaded = signal(false);
  readonly isNotificationPanelLoading = signal(false);
  readonly notificationOpen = signal(false);

  readonly activeChildren = computed(
    () => this.activeDropdown()?.children ?? [],
  );

  readonly brandLogoSrc = this.theme.brandLogoSrc;

  private readonly navPopover = viewChild<Popover>('navPopover');
  private readonly userPopover = viewChild<Popover>('userPopover');
  private readonly notificationPopover = viewChild<Popover>('notificationPopover');
  private readonly notificationHost = viewChild('notificationHost', {
    read: ViewContainerRef,
  });
  private notificationPanel: ComponentRef<NotificationPanel> | null = null;
  private requestedPopover: 'user' | 'notifications' | null = null;
  private readonly loadNotificationPanel = () =>
    import('../../../auth/components/notification-panel/notification-panel').then(
      ({ NotificationPanel }) => NotificationPanel,
    );
  private readonly userMenuHost = viewChild('userMenuHost', {
    read: ViewContainerRef,
  });
  private readonly loadUserMenuPanel = () =>
    import('../../../auth/components/user-menu-panel/user-menu-panel').then(
      ({ UserMenuPanel }) => UserMenuPanel as Type<CloseableOverlayComponent>,
    );

  constructor() {
    effect(() => {
      if (!this.isAuthenticated()) this.closeNotifications();
    });
  }

  openDropdown(event: Event, item: CommonNavMenuItem): void {
    if (!item.children?.length) return;

    if (this.activeDropdown()?.labelKey === item.labelKey) {
      this.closeDropdown();
      return;
    }

    this.closeUserMenu();
    this.closeNotifications();
    this.activeDropdown.set(item);
    this.navPopover()?.show(event);
  }

  closeDropdown(): void {
    this.navPopover()?.hide();
    this.activeDropdown.set(null);
  }

  openUserMenu(event: Event): void {
    this.closeDropdown();
    this.closeNotifications();
    this.closeMobile();
    this.requestedPopover = 'user';

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
    if (this.requestedPopover === 'user') this.requestedPopover = null;
    this.userPopover()?.hide();
  }

  openNotifications(event: Event): void {
    this.closeDropdown();
    this.closeUserMenu();
    this.closeMobile();
    this.requestedPopover = 'notifications';

    if (this.notificationPanel) {
      this.notificationPopover()?.toggle(event);
    } else if (!this.isNotificationPanelLoading()) {
      this.mountNotificationPanel(event);
    }
  }

  onNotificationsShow(): void {
    this.notificationOpen.set(true);
    this.notificationPanel?.instance.open();
  }

  closeNotifications(): void {
    if (this.requestedPopover === 'notifications') this.requestedPopover = null;
    this.notificationOpen.set(false);
    this.notificationPopover()?.hide();
  }

  openMobile(): void {
    this.closeDropdown();
    this.closeUserMenu();
    this.closeNotifications();
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
    const target = event.currentTarget;
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
          if (this.requestedPopover === 'user') this.userPopover()?.toggle(event, target);
        },
      });
  }

  private mountNotificationPanel(event: Event): void {
    const target = event.currentTarget;
    const host = this.notificationHost();
    if (!host) return;

    this.isNotificationPanelLoading.set(true);
    this.lazyComponentLoader.mount({
      host,
      load: this.loadNotificationPanel,
      onMount: (componentRef) => {
        this.notificationPanel = componentRef;
        componentRef.instance.closed.subscribe(() => this.closeNotifications());
      },
    }).pipe(
      finalize(() => this.isNotificationPanelLoading.set(false)),
    ).subscribe({
      next: () => {
        if (this.requestedPopover === 'notifications' && this.isAuthenticated()) {
          this.notificationPopover()?.toggle(event, target);
        }
      },
    });
  }

  trackByLabelKey = (_: number, item: CommonNavMenuItem) => item.labelKey;
}
