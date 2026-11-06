import { forkJoin, map, type Observable } from 'rxjs';

import type { AdminEventCoreDispositionResult } from '../../interfaces/i-event-admin';
import { EventAdmin } from '../../services/event-admin/event-admin';
import { assertEdgeContract } from '../../utils/edge-contract';
import { buildEventCoreListRows, type EventCoreListRow } from '../../utils/event-admin-list';

export function readAdminEventCoreRows(admin: EventAdmin, includeArchived: boolean): Observable<EventCoreListRow[]> {
  return forkJoin({ cores: admin.getCoreList(includeArchived), editions: admin.getEditionList() }).pipe(
    map(({ cores, editions }) => buildEventCoreListRows(cores, editions)),
  );
}

export function readAdminEventCoreDisposition(admin: EventAdmin, result: AdminEventCoreDispositionResult,
  includeArchived: boolean): Observable<EventCoreListRow[]> {
  return forkJoin({
    rows: readAdminEventCoreRows(admin, includeArchived),
    details: forkJoin(result.items.map(item => admin.getCoreDetail(item.coreId))),
  }).pipe(map(({ rows, details }) => {
    for (const [index, item] of result.items.entries()) {
      const detail = details[index];
      const row = rows.find(row => row.core.id === item.coreId)?.core;
      if (item.outcome === 'deleted' || item.reason === 'NOT_FOUND') {
        assertEdgeContract(detail === null && row === undefined, 'disposition.readback.deleted', 'no Core in canonical detail and list');
      } else {
        assertEdgeContract(detail !== null && detail.id === item.coreId,
          'disposition.readback.core', 'the same surviving Core in the canonical detail');
        if (item.outcome === 'archived') {
          assertEdgeContract(detail.archived && detail.archivedAt !== null && detail.archivedBy !== null &&
            detail.everPublished && !detail.isActive && !detail.hasPublicPage && detail.editions.every(edition => !edition.isActive),
          'disposition.readback.archive', 'retained archived Core/Edition identities, archive metadata and disabled visibility');
        }
        assertEdgeContract(includeArchived || !detail.archived ? row !== undefined &&
          row.archived === detail.archived && row.archivedAt === detail.archivedAt && row.everPublished === detail.everPublished &&
          row.isActive === detail.isActive && row.hasPublicPage === detail.hasPublicPage : row === undefined,
        'disposition.readback.list', 'a list consistent with the current Core and requested archive filter');
      }
    }
    return rows;
  }));
}
