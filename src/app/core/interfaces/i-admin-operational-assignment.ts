import type { IAdminOperationalCoworkerOption } from './i-admin-operational-catalog';
import type { ICoworkerOperationalAssignment } from './i-coworker-operational-document';
import type { ConfigureAdminOperationalTarget } from '../types/admin-operational-version';

export type AdminOperationalTargetProvenance = {
  readonly targetId: string;
} & ConfigureAdminOperationalTarget;

export interface IAdminOperationalAssignmentListItem {
  readonly user: IAdminOperationalCoworkerOption;
  readonly assignment: ICoworkerOperationalAssignment;
  readonly targetProvenance: readonly AdminOperationalTargetProvenance[];
}
