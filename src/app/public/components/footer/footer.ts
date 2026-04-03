import { APP_BASE_HREF, NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  ComponentRef,
  OutputEmitterRef,
  Type,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { firstValueFrom } from 'rxjs';

import { LazyMountHost } from '../../../core/directives/lazy-mount-host/lazy-mount-host';
import { LazyComponentLoader } from '../../../core/services/lazy-component-loader/lazy-component-loader';
import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';
import {
  ActiveLegalDialog,
  LegalDialogContent,
  LegalDialogsPayload,
  LegalJsonPayload,
} from '../../../core/types/i18n/legal';
import { UILegalLink } from '../../../core/types/i18n/footer';
import { createFooterI18n } from './footer.i18n';

interface LazyLegalDialogComponent {
  visible: unknown;
  dialogTitle: unknown;
  dialogSubtitle: unknown;
  dialogContent: unknown;
  closeLabel: unknown;
  visibleChange: OutputEmitterRef<boolean>;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, ButtonModule, NgOptimizedImage, LazyMountHost],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  providers: [provideTranslocoScope('common'), provideTranslocoScope('footer')],
})
export class Footer {
  private readonly lazyComponentLoader = inject(LazyComponentLoader);
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
  private readonly legalDialogHost = viewChild(LazyMountHost);
  private readonly loadLegalDialog = () =>
    import('../../common/legal-dialog/legal-dialog').then(
      ({ LegalDialog }) => LegalDialog as Type<LazyLegalDialogComponent>,
    );
  private readonly legalDialogRef =
    signal<ComponentRef<LazyLegalDialogComponent> | null>(null);
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

  readonly footerImgSrc = this.theme.footerImageSrc;

  readonly isLegalDialogVisible = computed(
    () =>
      this.activeLegalDialog() !== null &&
      (this.isLegalDialogLoading() ||
        !!this.activeLegalDialogContent() ||
        !!this.legalDialogError()),
  );

  readonly legalDialogTitle = computed(
    () =>
      this.activeLegalDialogContent()?.title ??
      (this.isLegalDialogLoading()
        ? 'Ladowanie...'
        : this.legalDialogError()
          ? 'Nie udalo sie zaladowac tresci'
          : ''),
  );

  readonly legalDialogSubtitle = computed(
    () => this.activeLegalDialogContent()?.subtitle ?? '',
  );

  readonly legalDialogContent = computed(() => {
    const content = this.activeLegalDialogContent()?.content;
    if (content) return content;

    if (this.isLegalDialogLoading()) {
      return 'Ladowanie tresci dokumentu...';
    }

    if (this.legalDialogError()) {
      return this.legalDialogError();
    }

    return null;
  });

  private readonly syncLegalDialogInputs = effect(() => {
    const dialogRef = this.legalDialogRef();
    if (!dialogRef) {
      return;
    }

    dialogRef.setInput('visible', this.isLegalDialogVisible());
    dialogRef.setInput('dialogTitle', this.legalDialogTitle());
    dialogRef.setInput('dialogSubtitle', this.legalDialogSubtitle());
    dialogRef.setInput('dialogContent', this.legalDialogContent());
  });

  track(_label: string): void {}

  protected isLegalDialogLink(link: UILegalLink): boolean {
    return this.resolveLegalDialog(link) !== null;
  }

  async onLegalClick(link: UILegalLink): Promise<void> {
    const targetDialog = this.resolveLegalDialog(link);

    if (!targetDialog) {
      this.track(link.label);
      return;
    }

    this.track(link.label);
    this.ensureLegalDialogMounted();
    this.activeLegalDialog.set(targetDialog);

    this.legalDialogError.set('');
    this.activeLegalDialogContent.set(null);
    this.isLegalDialogLoading.set(true);

    try {
      const dialogs = await this.loadLegalDialogs();
      this.activeLegalDialogContent.set(dialogs[targetDialog] ?? null);

      if (!dialogs[targetDialog]) {
        this.legalDialogError.set('Nie znaleziono tresci dokumentu.');
      }
    } catch {
      this.legalDialogError.set(
        'Nie udalo sie zaladowac tresci dokumentu. Sprobuj ponownie za chwile.',
      );
    } finally {
      this.isLegalDialogLoading.set(false);
    }
  }

  resolveLegalLinkPath(link: UILegalLink): string | null {
    if (this.resolveLegalDialog(link)) {
      return null;
    }

    return link.path;
  }

  private ensureLegalDialogMounted(): void {
    if (this.legalDialogRef()) {
      return;
    }

    const host = this.legalDialogHost()?.viewContainerRef;
    if (!host) {
      return;
    }

    this.lazyComponentLoader
      .mount({
        host,
        load: this.loadLegalDialog,
        onMount: (componentRef) => {
          this.legalDialogRef.set(componentRef);
          componentRef.instance.visibleChange.subscribe((visible) => {
            this.onLegalDialogVisibleChange(visible);
          });
        },
      })
      .subscribe();
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
        this.http.get<LegalJsonPayload>(`${this.baseHref}assets/i18n/pl/legal.json`),
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
