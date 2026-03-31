import { APP_BASE_HREF } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

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
  providers: [provideTranslocoScope('common'), provideTranslocoScope('footer')],
})
export class Footer {
  readonly nav = inject(Navigation);
  readonly theme = inject(Theme);
  readonly i18n = createFooterI18n();
  private readonly http = inject(HttpClient);
  private readonly appBaseHref = inject(APP_BASE_HREF, { optional: true }) ?? '/';

  private readonly baseHref = this.appBaseHref.endsWith('/')
    ? this.appBaseHref
    : `${this.appBaseHref}/`;

  readonly activeLegalDialog = signal<ActiveLegalDialog>(null);
  readonly activeLegalDialogContent = signal<LegalDialogContent | null>(null);
  readonly isLegalDialogLoading = signal(false);
  readonly legalDialogError = signal('');
  private legalDialogsCache: LegalDialogsPayload | null = null;
  private legalDialogsPromise: Promise<LegalDialogsPayload> | null = null;

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

  readonly isLegalDialogVisible = computed(
    () =>
      this.activeLegalDialog() !== null &&
      (this.isLegalDialogLoading() || !!this.activeLegalDialogContent() || !!this.legalDialogError()),
  );

  readonly legalDialogTitle = computed(
    () =>
      this.activeLegalDialogContent()?.title ??
      (this.isLegalDialogLoading()
        ? 'Ładowanie…'
        : this.legalDialogError()
          ? 'Nie udało się załadować treści'
          : ''),
  );

  readonly legalDialogSubtitle = computed(
    () => this.activeLegalDialogContent()?.subtitle ?? '',
  );

  readonly legalDialogContent = computed(
    () => {
      const content = this.activeLegalDialogContent()?.content;
      if (content) return content;

      if (this.isLegalDialogLoading()) {
        return 'Ładowanie treści dokumentu…';
      }

      if (this.legalDialogError()) {
        return this.legalDialogError();
      }

      return null;
    },
  );

  track(_label: string): void {}

  async onLegalClick(link: UILegalLink, event: MouseEvent): Promise<void> {
    const targetDialog = this.resolveLegalDialog(link);

    if (!targetDialog) {
      this.track(link.label);
      return;
    }

    event.preventDefault();
    this.track(link.label);
    this.activeLegalDialog.set(targetDialog);

    this.legalDialogError.set('');
    this.activeLegalDialogContent.set(null);
    this.isLegalDialogLoading.set(true);

    try {
      const dialogs = await this.loadLegalDialogs();
      this.activeLegalDialogContent.set(dialogs[targetDialog] ?? null);

      if (!dialogs[targetDialog]) {
        this.legalDialogError.set('Nie znaleziono treści dokumentu.');
      }
    } catch {
      this.legalDialogError.set(
        'Nie udało się załadować treści dokumentu. Spróbuj ponownie za chwilę.',
      );
    } finally {
      this.isLegalDialogLoading.set(false);
    }
  }

  onLegalDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.activeLegalDialog.set(null);
      this.activeLegalDialogContent.set(null);
      this.isLegalDialogLoading.set(false);
      this.legalDialogError.set('');
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

  private async loadLegalDialogs(): Promise<LegalDialogsPayload> {
    if (this.legalDialogsCache) {
      return this.legalDialogsCache;
    }

    if (!this.legalDialogsPromise) {
      this.legalDialogsPromise = firstValueFrom(
        this.http.get<LegalJsonPayload>('/assets/i18n/pl/legal.json'),
      )
        .then((payload) => {
          const dialogs = {
            terms: payload.termsDialog ?? null,
            'privacy-policy': payload.privacyPolicyDialog ?? null,
          } satisfies LegalDialogsPayload;

          this.legalDialogsCache = dialogs;
          return dialogs;
        })
        .catch((error: unknown) => {
          this.legalDialogsPromise = null;
          throw error;
        });
    }

    return this.legalDialogsPromise;
  }
}

type LegalJsonPayload = {
  termsDialog?: LegalDialogContent;
  privacyPolicyDialog?: LegalDialogContent;
};

type LegalDialogsPayload = Record<Exclude<ActiveLegalDialog, null>, LegalDialogContent | null>;
