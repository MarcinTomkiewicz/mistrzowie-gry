import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import { IMenu } from '../../../core/interfaces/i-menu';
import {
  CommonAccessibilityTranslations,
  CommonNavTranslations,
} from '../../../core/types/common-i18n';

export type UIMenu = IMenu & {
  label: string;
  children?: UIMenu[];
};

export function createNavbarI18n() {
  const navDict = translateObjectSignal('nav', {}, { scope: 'common' });
  const accessibilityDict = translateObjectSignal(
    'accessibility',
    {},
    { scope: 'common' },
  );

  const nav = computed(() => navDict() as CommonNavTranslations);
  const accessibility = computed(
    () => accessibilityDict() as CommonAccessibilityTranslations,
  );

  const resolveLabel = (labelKey: string): string => {
    const key = labelKey.replace(/^nav\./, '') as keyof CommonNavTranslations;
    return nav()[key] ?? labelKey;
  };

  const resolveMenu = (items: IMenu[]): UIMenu[] =>
    items.map((item) => ({
      ...item,
      label: resolveLabel(item.labelKey),
      children: item.children?.length ? resolveMenu(item.children) : undefined,
    }));

  return {
    accessibility,
    resolveLabel,
    resolveMenu,
  };
}