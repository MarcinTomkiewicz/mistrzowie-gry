import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ConfirmationService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DrawerModule } from 'primeng/drawer';
import { Popover, PopoverModule } from 'primeng/popover';

import { provideTranslocoScope } from '@jsverse/transloco';

import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import { ThemeSwitch } from '../../common/theme-switch/theme-switch';
import { createNavbarI18n, UIMenu } from './navbar.i18n';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    PopoverModule,
    DrawerModule,
    ConfirmPopupModule,
    ThemeSwitch,
    NgOptimizedImage,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  providers: [provideTranslocoScope('common')],
})
export class Navbar {
  private readonly nav = inject(Navigation);
  private readonly uiConfirm = inject(UiConfirm);

  readonly theme = inject(Theme);
  readonly i18n = createNavbarI18n();

  readonly menu = computed(() => this.i18n.resolveMenu(this.nav.navbar()));

  readonly mobileOpen = signal(false);
  readonly activeDropdown = signal<UIMenu | null>(null);

  readonly activeChildren = computed(
    () => this.activeDropdown()?.children ?? [],
  );

  readonly brandLogoSrc = this.theme.brandLogoSrc;

  private readonly navPopover = viewChild<Popover>('navPopover');

  openDropdown(event: Event, item: UIMenu): void {
    if (!item.children?.length) return;

    if (this.activeDropdown()?.labelKey === item.labelKey) {
      this.closeDropdown();
      return;
    }

    this.activeDropdown.set(item);
    this.navPopover()?.show(event);
  }

  closeDropdown(): void {
    this.navPopover()?.hide();
    this.activeDropdown.set(null);
  }

  openMobile(): void {
    this.mobileOpen.set(true);
    this.closeDropdown();
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

  trackByLabelKey = (_: number, item: UIMenu) => item.labelKey;
}
