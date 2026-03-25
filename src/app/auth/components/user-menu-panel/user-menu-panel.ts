import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';

import { Auth } from '../../../core/services/auth/auth';
import { IUserMenuItem } from '../../../core/types/user-menu';
import { createUserMenuPanelI18n } from './user-menu-panel.i18n';
import { buildUserMenu } from '../../../core/factories/user-menu.factory';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-user-menu-panel',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, DividerModule],
  templateUrl: './user-menu-panel.html',
  styleUrl: './user-menu-panel.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class UserMenuPanel {
  private readonly auth = inject(Auth);

  readonly closed = output<void>();

  readonly i18n = createUserMenuPanelI18n();

  readonly usernameDisplay = computed(() => this.auth.displayName());

readonly menuSections = computed(() =>
  buildUserMenu({
    accountTitle: this.i18n.userMenu().accountSectionTitle,
    editProfileLabel: this.i18n.userMenu().editProfileLabel,
  }),
);

readonly logoutLabel = computed(() => this.i18n.commonActions().logout);

  onNavigate(): void {
    this.closed.emit();
  }

  logout(): void {
    this.auth.logout('/').subscribe({
      next: () => {
        this.closed.emit();
      },
      error: () => {
        this.closed.emit();
      },
    });
  }

  isActionItem(item: IUserMenuItem): boolean {
    return !!item.action;
  }
}