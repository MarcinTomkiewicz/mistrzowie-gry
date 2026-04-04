import { Component } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import {
  UiSeoTextColumn,
  UiSeoTextSection,
} from '../../../../core/types/i18n/home';
import { createSeoRichTextI18n } from './seo-rich-text.i18n';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

@Component({
  selector: 'app-seo-rich-text',
  standalone: true,
  imports: [AnimateOnScrollModule],
  templateUrl: './seo-rich-text.html',
  providers: [provideTranslocoScope('home')],
})
export class SeoRichText {
  readonly i18n = createSeoRichTextI18n();

  readonly header = this.i18n.header;
  readonly columns = this.i18n.columns;

  trackByColId = (_: number, col: UiSeoTextColumn): number => col.id;
  trackBySectionId = (_: number, section: UiSeoTextSection): number => section.id;
  trackByIndex = (i: number): number => i;
}
