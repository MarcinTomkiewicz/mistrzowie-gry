import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  AdminStaffingEditorCopy,
  AdminStaffingShellCopy,
} from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRealizationShellI18n() {
  return createScopedSectionsI18n<{
    editor: AdminStaffingEditorCopy;
    shell: AdminStaffingShellCopy;
  }>('adminStaffing', {
    editor: 'editor',
    shell: 'shell',
  });
}
