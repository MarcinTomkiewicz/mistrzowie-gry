import { computed } from '@angular/core';

import { IMenu } from '../../../core/interfaces/i-menu';
import type {
  CommonNavMenuItem,
  CommonNavTranslations,
} from '../../../core/types/i18n/common';
import {
  createCommonAccessibilityI18n,
  createCommonActionsI18n,
  createCommonInfoI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';

export function createNavbarI18n() {
  const nav = createCommonNavI18n();
  const accessibility = createCommonAccessibilityI18n();
  const actions = createCommonActionsI18n();
  const info = createCommonInfoI18n();
  const status = createCommonStatusI18n();

  const resolveLabel = (labelKey: string): string => {
    const key = labelKey.replace(/^nav\./, '') as keyof CommonNavTranslations;
    return nav()[key] ?? labelKey;
  };

  const resolveMenu = (items: IMenu[]): CommonNavMenuItem[] =>
    items.map((item) => ({
      ...item,
      label: resolveLabel(item.labelKey),
      children: item.children?.length ? resolveMenu(item.children) : undefined,
    }));

  return {
    nav,
    accessibility,
    actions,
    info,
    status,
    resolveLabel,
    resolveMenu,
  };
}
