import { Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import { createFooterI18n } from './footer.i18n';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, NgOptimizedImage],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  providers: [provideTranslocoScope('common')],
})
export class Footer {
  readonly nav = inject(Navigation);
  readonly theme = inject(Theme);
  readonly i18n = createFooterI18n();

  readonly year = computed(() => new Date().getFullYear());

  readonly footerLinks = computed(() =>
    this.i18n.resolveFooterMenu(this.nav.footer()),
  );

  readonly socialLinks = computed(() =>
    this.i18n.resolveSocialLinks(this.nav.social()),
  );

  readonly legalLinks = computed(() =>
    this.i18n.resolveLegalLinks(this.nav.legal()),
  );

  readonly footerImgSrc = computed(() =>
    this.theme.isLight() ? 'theme/light/footer.avif' : 'theme/dark/footer.avif',
  );

  track(_label: string): void {}
}