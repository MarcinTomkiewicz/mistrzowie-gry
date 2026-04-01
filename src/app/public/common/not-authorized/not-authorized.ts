import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';
import { Seo } from '../../../core/services/seo/seo';
import { createStatusPageI18n } from '../../../core/translations/status-page.i18n';

@Component({
  selector: 'app-not-authorized',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, NgOptimizedImage],
  templateUrl: './not-authorized.html',
  styleUrl: './not-authorized.scss',
  providers: [provideTranslocoScope('common')],
})
export class NotAuthorized {
  private readonly seo = inject(Seo);

  readonly i18n = createStatusPageI18n('notAuthorized');

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.page().seoTitle,
      description: this.i18n.page().seoDescription,
    });
  });
}
