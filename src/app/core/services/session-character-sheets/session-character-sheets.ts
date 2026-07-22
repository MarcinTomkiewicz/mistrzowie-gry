import { inject, Injectable } from '@angular/core';
import {
  catchError,
  defer,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { SessionCharacterSheetRow } from '../../types/session-character-sheet';
import {
  SessionSourceKind,
  SESSION_SOURCE_CONFIG,
} from '../../types/session-source';
import { Backend } from '../backend/backend';
import { Storage } from '../storage/storage';

@Injectable({ providedIn: 'root' })
export class SessionCharacterSheets {
  private readonly backend = inject(Backend);
  private readonly storage = inject(Storage);

  sync(
    sessionId: string,
    source: SessionSourceKind,
    ownerId: string,
    newFiles: readonly File[],
    removedSheetIds: readonly string[],
  ): Observable<void> {
    if (!newFiles.length && !removedSheetIds.length) {
      return of(void 0);
    }

    return this.getRows(sessionId, source).pipe(
      switchMap((rows) => {
        const rowsToRemove = rows.filter((row) =>
          removedSheetIds.includes(row.id),
        );

        return this.uploadFiles(sessionId, source, ownerId, newFiles).pipe(
          switchMap(() => this.removeRows(rowsToRemove, source)),
        );
      }),
    );
  }

  remove(
    sessionId: string,
    source: SessionSourceKind,
  ): Observable<void> {
    return this.getRows(sessionId, source).pipe(
      switchMap((rows) => this.removeRows(rows, source)),
    );
  }

  private uploadFiles(
    sessionId: string,
    source: SessionSourceKind,
    ownerId: string,
    files: readonly File[],
  ): Observable<void> {
    if (!files.length) {
      return of(void 0);
    }

    const config = SESSION_SOURCE_CONFIG[source];

    return defer(() => {
      const uploadedPaths: string[] = [];

      return forkJoin(
        files.map((file) =>
          this.storage
            .uploadFile(file, {
              bucket: 'docs',
              folder: `sessions/${ownerId}/${sessionId}/characters`,
              usePublicUrl: false,
            })
            .pipe(
              tap((result) => uploadedPaths.push(result.path)),
              map((result) => ({
                ok: true as const,
                row: {
                  [config.sessionIdKey]: sessionId,
                  storagePath: result.path,
                  fileName: file.name,
                },
              })),
              catchError((error: unknown) =>
                of({ ok: false as const, error }),
              ),
            ),
        ),
      ).pipe(
        switchMap((results) => {
          const failedUpload = results.find((result) => !result.ok);

          if (failedUpload) {
            return throwError(() => failedUpload.error);
          }

          const rows = results.flatMap((result) =>
            result.ok ? [result.row] : [],
          );

          return this.backend.createMany<Record<string, string>>(
            config.characterSheetsTable,
            rows,
          );
        }),
        map(() => void 0),
        catchError((error: unknown) =>
          this.storage.removeFiles(uploadedPaths, 'docs').pipe(
            catchError(() => of(void 0)),
            switchMap(() => throwError(() => error)),
          ),
        ),
      );
    });
  }

  private removeRows(
    rows: readonly SessionCharacterSheetRow[],
    source: SessionSourceKind,
  ): Observable<void> {
    if (!rows.length) {
      return of(void 0);
    }

    const config = SESSION_SOURCE_CONFIG[source];
    const storagePaths = rows.map((row) => row.storagePath);

    return this.backend
      .delete(config.characterSheetsTable, {
        id: {
          operator: FilterOperator.IN,
          value: rows.map((row) => row.id),
        },
      })
      .pipe(switchMap(() => this.storage.removeFiles(storagePaths, 'docs')));
  }

  private getRows(
    sessionId: string,
    source: SessionSourceKind,
  ): Observable<SessionCharacterSheetRow[]> {
    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend.getAll<SessionCharacterSheetRow>({
      table: config.characterSheetsTable,
      sortBy: 'createdAt',
      sortOrder: 'asc',
      pagination: {
        filters: {
          [config.sessionIdKey]: {
            operator: FilterOperator.EQ,
            value: sessionId,
          },
        },
      },
    });
  }
}
