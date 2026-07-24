import type {
  IAdminOperationalCatalog,
  IAdminOperationalCoworkerOption,
  IAdminOperationalEventOption,
} from '../../../core/interfaces/i-admin-operational-catalog';
import type { AppRoleLabels } from '../../../core/types/app-role';
import type {
  AdminOperationalTargetKind,
  ConfigureAdminOperationalTarget,
} from '../../../core/types/admin-operational-version';
import { getAppRoleLabel } from '../../../core/utils/app-role-labels';
import { assertEdgeContract } from '../../../core/utils/edge-contract';

export function formatAdminOperationalCoworkerLabel(
  coworker: Pick<IAdminOperationalCoworkerOption, 'email' | 'firstName'>,
): string {
  const firstName = coworker.firstName?.trim();
  return firstName ? `${firstName} - ${coworker.email}` : coworker.email;
}

export function formatAdminOperationalEventLabel(
  eventDefinition: Pick<IAdminOperationalEventOption, 'key' | 'name'>,
): string {
  return `${eventDefinition.name} - ${eventDefinition.key}`;
}

export function resolveAdminOperationalTargetLabel(
  target: ConfigureAdminOperationalTarget,
  catalog: IAdminOperationalCatalog,
  targetKindLabels: Readonly<Record<AdminOperationalTargetKind, string>>,
  appRoleLabels: AppRoleLabels,
): string {
  switch (target.targetKind) {
    case 'all_active_coworkers':
      return targetKindLabels.all_active_coworkers;
    case 'app_role':
      return getAppRoleLabel(target.appRole, appRoleLabels);
    case 'user': {
      const coworker = catalog.coworkers.find(
        (option) => option.userId === target.userId,
      );
      assertEdgeContract(
        coworker !== undefined,
        'operationalTarget.userId',
        'present in catalog.coworkers',
      );
      return formatAdminOperationalCoworkerLabel(coworker);
    }
    case 'event_definition': {
      const eventDefinition = catalog.eventDefinitions.find(
        (option) => option.id === target.eventDefinitionId,
      );
      assertEdgeContract(
        eventDefinition !== undefined,
        'operationalTarget.eventDefinitionId',
        'present in catalog.eventDefinitions',
      );
      return formatAdminOperationalEventLabel(eventDefinition);
    }
  }
}
