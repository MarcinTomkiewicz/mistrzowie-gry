import {
  IAdminOperationalCatalog,
  IAdminOperationalStoredVersion,
  IAdminOperationalUnpublishedVersion,
} from '../../interfaces/i-admin-coworker-operational-document';
import { assertEdgeContract } from '../../utils/edge-contract';

export function assertOperationalTargetRelations(
  version: IAdminOperationalStoredVersion | IAdminOperationalUnpublishedVersion,
  catalog: IAdminOperationalCatalog,
  path: string,
): void {
  version.targets.forEach((target, index) => {
    const targetPath = `${path}.targets[${index}]`;
    switch (target.targetKind) {
      case 'all_active_coworkers':
        break;
      case 'app_role':
        assertEdgeContract(
          catalog.appRoles.includes(target.appRole),
          `${targetPath}.appRole`,
          'an application role present in the catalog',
        );
        break;
      case 'user':
        assertEdgeContract(
          catalog.coworkers.some(
            (coworker) => coworker.userId === target.userId,
          ),
          `${targetPath}.userId`,
          'a coworker present in the catalog',
        );
        break;
      case 'event_definition':
        assertEdgeContract(
          catalog.eventDefinitions.some(
            (eventDefinition) =>
              eventDefinition.id === target.eventDefinitionId,
          ),
          `${targetPath}.eventDefinitionId`,
          'an event definition present in the catalog',
        );
        break;
    }
  });
}
