import { Component, ViewChild, computed, inject, signal, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';

import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Popover, PopoverModule } from 'primeng/popover';
import { DrawerModule } from 'primeng/drawer';

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
    NgOptimizedImage,
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

  readonly activeChildren = computed(() => this.activeDropdown()?.children ?? []);
  readonly brandLogoSrc = this.theme.brandLogoSrc;

  private readonly navPopover = viewChild<Popover>('navPopover');

  onThemeToggle(nextLight: boolean): void {
    this.theme.set(nextLight ? 'light' : 'dark');
  }

  openDropdown(event: Event, item: IMenu): void {
    if (!item.children?.length) return;

    if (this.activeDropdown()?.label === item.label) {
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

  trackByLabel = (_: number, item: IMenu) => item.label;
}