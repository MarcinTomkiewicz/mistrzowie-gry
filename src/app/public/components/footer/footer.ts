import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE,
} from '../../../core/config/site';
import { LegalDialogs } from '../../../core/services/legal-dialogs/legal-dialogs';
import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import { createFooterI18n } from './footer.i18n';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  providers: [provideTranslocoScope('common', 'footer')],
})
export class Footer {
  private readonly nav = inject(Navigation);
  private readonly theme = inject(Theme);
  readonly i18n = createFooterI18n();
  protected readonly legalDialogs = inject(LegalDialogs);

  readonly year = new Date().getFullYear();
  readonly contact = {
    phone: PUBLIC_CONTACT_PHONE,
    phoneHref: `tel:${PUBLIC_CONTACT_PHONE.replace(/\s/g, '')}`,
    email: PUBLIC_CONTACT_EMAIL,
    emailHref: `mailto:${PUBLIC_CONTACT_EMAIL}`,
  };

  readonly links = computed(() => {
    const legal = this.i18n.resolveLegalLinks(this.nav.legal());

    return {
      shortcuts: this.i18n.resolveFooterMenu(this.nav.footer()),
      social: this.i18n.resolveSocialLinks(this.nav.social()),
      legal: legal.filter((link) => link.placement === 'bottom'),
      legalInformation: legal.filter(
        (link) => link.placement === 'legal-information',
      ),
    };
  });

  readonly footerImgSrc = this.theme.footerImageSrc;
}
