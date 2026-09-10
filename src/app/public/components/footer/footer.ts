import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE,
} from '../../../core/config/site';
import { LegalDialogs } from '../../../core/services/legal-dialogs/legal-dialogs';
import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import {
  LegalDialogContent,
  LegalDialogId,
} from '../../../core/types/i18n/legal';
import { LegalDialog } from '../../common/legal-dialog/legal-dialog';
import { createFooterI18n } from './footer.i18n';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, LegalDialog],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  providers: [provideTranslocoScope('common', 'footer')],
})
export class Footer {
  private readonly nav = inject(Navigation);
  private readonly theme = inject(Theme);
  readonly i18n = createFooterI18n();
  private readonly legalDialogs = inject(LegalDialogs);

  private readonly activeLegalDialog = signal<LegalDialogId | null>(null);
  private readonly activeLegalDialogContent =
    signal<LegalDialogContent | null>(null);
  private readonly isLegalDialogLoading = signal(false);
  private readonly legalDialogError = signal<string | null>(null);

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

  readonly legalDialogViewModel = computed(() => {
    const activeDialog = this.activeLegalDialog();
    const dialog = this.activeLegalDialogContent();
    const links = this.links();
    const fallbackTitle =
      links.legal.find((link) => link.dialog === activeDialog)?.label ??
      links.legalInformation.find((link) => link.dialog === activeDialog)
        ?.label ??
      '';
    const error = this.legalDialogError();
    const loading = this.isLegalDialogLoading();

    return {
      visible: activeDialog !== null,
      title: dialog?.title ?? fallbackTitle,
      subtitle: dialog?.subtitle ?? '',
      content:
        dialog?.content ??
        (loading ? this.i18n.commonStatus().loading : error),
      closeLabel: this.i18n.commonActions().close,
    };
  });

  async onLegalClick(targetDialog: LegalDialogId): Promise<void> {
    this.activeLegalDialog.set(targetDialog);

    this.legalDialogError.set(null);
    this.activeLegalDialogContent.set(null);
    this.isLegalDialogLoading.set(true);

    try {
      const dialog = await this.legalDialogs.load(targetDialog);

      if (this.activeLegalDialog() === targetDialog) {
        this.activeLegalDialogContent.set(dialog);
      }
    } catch {
      if (this.activeLegalDialog() === targetDialog) {
        this.legalDialogError.set(this.i18n.commonErrors().generic);
      }
    } finally {
      if (this.activeLegalDialog() === targetDialog) {
        this.isLegalDialogLoading.set(false);
      }
    }
  }

  closeLegalDialog(): void {
    this.activeLegalDialog.set(null);
    this.activeLegalDialogContent.set(null);
    this.isLegalDialogLoading.set(false);
    this.legalDialogError.set(null);
  }
}
