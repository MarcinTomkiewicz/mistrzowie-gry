import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Popover, PopoverModule } from 'primeng/popover';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';

import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import { IMenu } from '../../../core/interfaces/i-menu';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ToggleSwitchModule,
    PopoverModule,
    DrawerModule,
    ButtonModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly nav = inject(Navigation);
  readonly theme = inject(Theme);

  readonly menu = this.nav.navbar;

  readonly mobileOpen = signal(false);
  readonly activeDropdown = signal<IMenu | null>(null);

  readonly activeChildren = computed<IMenu[]>(() => {
    const a = this.activeDropdown();
    return a?.children ?? [];
  });

  readonly brandLogoSrc = this.theme.brandLogoSrc;

  @ViewChild('navPopover') private readonly navPopover?: Popover;

  // ===== THEME =====
  onThemeToggle(nextLight: boolean): void {
    this.theme.set(nextLight ? 'light' : 'dark');
  }

  // ===== DROPDOWN / MOBILE =====
  openDropdown(event: Event, item: IMenu): void {
    if (!item.children?.length) return;

    if (this.activeDropdown()?.label === item.label) {
      this.closeDropdown();
      return;
    }

    this.activeDropdown.set(item);
    this.navPopover?.show(event);
  }

  closeDropdown(): void {
    this.navPopover?.hide();
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

  trackByLabel = (_: number, item: IMenu) => item.label;
}
