import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  AdminStaffingEditorCopy,
  AdminStaffingShellCopy,
} from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRealizationShellI18n() {
  return createScopedSectionsI18n<{
    page: AdminStaffingEditorCopy['page'];
    tabLabels: AdminStaffingShellCopy['tabs'];
  }>('adminStaffing', {
    page: 'editor.page',
    tabLabels: 'shell.tabs',
  });
}
