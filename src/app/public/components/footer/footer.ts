import { APP_BASE_HREF } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import { InfoDialog } from '../../common/info-dialog/info-dialog';
import {
  LegalDialogContent,
  UILegalLink,
  createFooterI18n,
} from './footer.i18n';

type ActiveLegalDialog = 'terms' | 'privacy-policy' | null;

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, InfoDialog],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  providers: [provideTranslocoScope('common'), provideTranslocoScope('legal')],
})
export class Footer {
  readonly nav = inject(Navigation);
  readonly theme = inject(Theme);
  readonly i18n = createFooterI18n();
  private readonly appBaseHref = inject(APP_BASE_HREF, { optional: true }) ?? '/';

  private readonly baseHref = this.appBaseHref.endsWith('/')
    ? this.appBaseHref
    : `${this.appBaseHref}/`;

  readonly activeLegalDialog = signal<ActiveLegalDialog>(null);

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
    this.theme.isLight()
      ? `${this.baseHref}theme/light/footer.avif`
      : `${this.baseHref}theme/dark/footer.avif`,
  );

  readonly isLegalDialogVisible = computed(() => this.activeLegalDialog() !== null);

  readonly activeLegalDialogContent = computed<LegalDialogContent | null>(() => {
    switch (this.activeLegalDialog()) {
      case 'terms':
        return this.i18n.termsDialog();
      case 'privacy-policy':
        return this.i18n.privacyPolicyDialog();
      default:
        return null;
    }
  });

  readonly legalDialogTitle = computed(
    () => this.activeLegalDialogContent()?.title ?? '',
  );

  readonly legalDialogSubtitle = computed(
    () => this.activeLegalDialogContent()?.subtitle ?? '',
  );

  readonly legalDialogContent = computed(
    () => this.activeLegalDialogContent()?.content ?? null,
  );

  track(_label: string): void {}

  onLegalClick(link: UILegalLink, event: MouseEvent): void {
    const targetDialog = this.resolveLegalDialog(link);

    if (!targetDialog) {
      this.track(link.label);
      return;
    }

    event.preventDefault();
    this.track(link.label);
    this.activeLegalDialog.set(targetDialog);
  }

  onLegalDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.activeLegalDialog.set(null);
    }
  }

  private resolveLegalDialog(link: UILegalLink): ActiveLegalDialog {
    if (this.isTermsLink(link)) {
      return 'terms';
    }

    if (this.isPrivacyPolicyLink(link)) {
      return 'privacy-policy';
    }

    return null;
  }

  private isTermsLink(link: UILegalLink): boolean {
    return (
      link.labelKey === 'legal.terms' ||
      link.path === '/legal/terms' ||
      link.path === 'legal/terms'
    );
  }

  private isPrivacyPolicyLink(link: UILegalLink): boolean {
    return (
      link.labelKey === 'legal.privacyPolicy' ||
      link.path === '/legal/privacy-policy' ||
      link.path === 'legal/privacy-policy' ||
      link.path === '/privacy-policy' ||
      link.path === 'privacy-policy'
    );
  }
}