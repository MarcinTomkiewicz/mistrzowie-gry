import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Popover, PopoverModule } from 'primeng/popover';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { Platform } from '../../../core/services/platform/platform';
import { Navigation } from '../../../core/services/navigation/navigation';
import { IMenu } from '../../../core/interfaces/i-menu';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,

    // PrimeNG
    ToggleSwitchModule,
    PopoverModule,
    DrawerModule,
    ButtonModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly platform = inject(Platform);
  private readonly nav = inject(Navigation);

  /**
   * Menu pochodzi z Navigation (single source of truth).
   * Nie trzymamy MENU_CONFIG w komponencie.
   */
  readonly menu = this.nav.navbar;

  /** true => light, false => dark (default) */
  readonly isLight = signal(false);

  /** mobile drawer */
  readonly mobileOpen = signal(false);

  /** dropdown state (dla popovera) */
  readonly activeDropdown = signal<IMenu | null>(null);

  /** dzieci aktywnego dropdownu (wygoda dla template) */
  readonly activeChildren = computed<IMenu[]>(() => {
    const a = this.activeDropdown();
    return a?.children ?? [];
  });

  readonly brandLogoSrc = computed(() =>
    this.isLight() ? 'theme/light/brand.png' : 'theme/dark/brand.png',
  );

  @ViewChild('navPopover') private readonly navPopover?: Popover;

  constructor() {
    // SSR-safe: tylko w przeglądarce czytamy DOM
    if (!this.platform.isBrowser) return;

    const doc = this.platform.document;
    if (!doc) return;

    this.isLight.set(
      doc.documentElement.getAttribute('data-theme') === 'light',
    );
  }

  log(data: any): void {
    console.log(data);
  }
  

  // ======================
  // THEME
  // ======================

  /**
   * Handler dla (onChange) z p-toggleswitch.
   * Źródło prawdy: signal isLight().
   */
  toggleTheme(): void {
    if (!this.platform.isBrowser) return;

    const doc = this.platform.document;
    if (!doc) return;

    const root = doc.documentElement;

    if (this.isLight()) {
      root.setAttribute('data-theme', 'light');
      this.isLight.set(true);
    }
    else {
      root.removeAttribute('data-theme')
      this.isLight.set(false);
    };
  }

  // ======================
  // DESKTOP DROPDOWN (POPOVER)
  // ======================

  /**
   * Prime Popover: toggle(event) potrzebuje eventu, żeby ustawić anchor.
   */
  openDropdown(event: Event, item: IMenu): void {
    if (!item.children?.length) return;

    // jeśli klikniesz ten sam dropdown -> zamknij
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

  // ======================
  // MOBILE DRAWER
  // ======================

  openMobile(): void {
    this.mobileOpen.set(true);
    // na mobile zamykamy popover jeśli był otwarty
    this.closeDropdown();
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  /**
   * Gdy klikniesz link w drawerze – zamykamy drawer.
   * (zoneless: sygnał wystarczy, brak CD magic)
   */
  onMobileNavigate(): void {
    this.closeMobile();
  }

  // ======================
  // HELPERS
  // ======================

  trackByLabel = (_: number, item: IMenu) => item.label;
}
