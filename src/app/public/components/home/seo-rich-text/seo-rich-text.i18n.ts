import { computed } from '@angular/core';

import { createCommonLabelsI18n } from '../../../../core/translations/common.i18n';
import {
  SeoTextColumnCopy,
  SeoTextHeader,
  UiSeoTextColumn,
} from '../../../../core/types/i18n/home';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  numberedRecordToStringArray,
  recordValuesSortedBy,
} from '../../../../core/utils/record-values';

export function createSeoRichTextI18n() {
  const { header, columnsDict } = createScopedSectionsI18n<{
    header: SeoTextHeader;
    columnsDict: Record<string, SeoTextColumnCopy>;
  }>('home', {
    header: 'seoText.header',
    columnsDict: 'seoText.columns',
  });

  const columns = computed<UiSeoTextColumn[]>(() =>
    recordValuesSortedBy(
      columnsDict(),
      (col) => col.id,
    ).map((col) => {
      const sections = recordValuesSortedBy(
        col.sections,
        (section) => section.id,
      ).map((section) => ({
        id: section.id,
        title: section.title,
        paragraphs: numberedRecordToStringArray(section.paragraphs),
      }));

      return {
        id: col.id,
        sections,
      };
    }),
  );
  const commonLabels = createCommonLabelsI18n();

  return {
    header,
    commonLabels,
    columns,
  };
}
