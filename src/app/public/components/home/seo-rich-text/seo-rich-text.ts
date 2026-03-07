import { Component } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import {
  createSeoRichTextI18n,
  UiSeoTextColumn,
  UiSeoTextSection,
} from './seo-rich-text.i18n';

@Component({
  selector: 'app-seo-rich-text',
  standalone: true,
  imports: [],
  templateUrl: './seo-rich-text.html',
  styleUrl: './seo-rich-text.scss',
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