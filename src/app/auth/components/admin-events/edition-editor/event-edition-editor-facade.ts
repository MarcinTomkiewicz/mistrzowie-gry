import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable, catchError, defer, finalize, forkJoin, map, of, switchMap, tap,
  throwError,
} from 'rxjs';

import { buildPublicEventPath, isPublicEventSlug } from '../../../../core/configs/events.config';
import type {
  EventEditionSaveResult, EventPublishResult, IAdminEventDetail,
  IEventCoreDetail, IEventSavePayload,
} from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';

@Injectable()
export class EventEditionEditorFacade {
  private readonly admin = inject(EventAdmin);
  private readonly coreState = signal<IEventCoreDetail | null>(null);
  private readonly editionState = signal<IAdminEventDetail | null>(null);
  private readonly loading = signal(true);
  private readonly operation = signal<'save' | 'publish' | null>(null);
  private readonly notFound = signal(false);
  private readonly publishResult = signal<EventPublishResult | null>(null);

  readonly core = this.coreState.asReadonly();
  readonly edition = this.editionState.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isNotFound = this.notFound.asReadonly();
  readonly publicationResult = this.publishResult.asReadonly();
  readonly isSaving = computed(() => this.operation() === 'save');
  readonly isPublishing = computed(() => this.operation() === 'publish');
  readonly isBusy = computed(() => this.loading() || this.operation() !== null);
  readonly privateDraftBlocked = computed(() => {
    const core = this.core();
    const edition = this.edition();
    return !!core && !!edition && !edition.isStaffingReleased &&
      (core.isActive || core.hasPublicPage || edition.isActive || edition.isDefaultPublic);
  });
  readonly publicPath = computed(() => {
    const edition = this.edition();
    return edition?.isStaffingReleased && edition.currentlyPublic &&
      isPublicEventSlug(edition.eventCoreKey) && isPublicEventSlug(edition.slug)
      ? buildPublicEventPath(edition.eventCoreKey, edition.slug) : null;
  });

  reset(): void {
    this.coreState.set(null);
    this.editionState.set(null);
    this.publishResult.set(null);
  }

  load(coreId: string, eventId: string): Observable<void> {
    return defer(() => {
      this.loading.set(true);
      this.notFound.set(false);
      return forkJoin({
        core: this.admin.getCoreDetail(coreId),
        edition: eventId
          ? this.admin.getEditionDetail(eventId)
          : of<IAdminEventDetail | null>(null),
      }).pipe(
        map(({ core, edition }) => {
          if (!core || (eventId && (!edition || edition.eventCoreId !== core.id))) {
            this.coreState.set(null);
            this.editionState.set(null);
            this.notFound.set(true);
            return;
          }
          this.coreState.set(core);
          this.editionState.set(edition);
        }),
        catchError((error: unknown) => {
          this.coreState.set(null);
          this.editionState.set(null);
          return throwError(() => error);
        }),
        finalize(() => this.loading.set(false)),
      );
    });
  }

  save(payload: IEventSavePayload, file: File | null): Observable<EventEditionSaveResult> {
    return defer(() => {
      this.operation.set('save');
      return this.admin.saveEditionWithCover(
        payload, file, this.edition()?.coverImagePath ?? null,
      ).pipe(
        tap((result) => {
          if (result.status === 'saved') this.editionState.set(result.edition);
        }),
        finalize(() => this.operation.set(null)),
      );
    });
  }

  publish(coreId: string, eventId: string): Observable<EventPublishResult> {
    return defer(() => {
      this.operation.set('publish');
      this.publishResult.set(null);
      return this.admin.publishStaffingEvent(eventId).pipe(
        tap((result) => this.publishResult.set(result)),
        switchMap((result) => this.load(coreId, eventId).pipe(
          map(() => {
            if (!this.edition() || !this.core()) {
              throw new Error('Published Event is missing from the admin read.');
            }
            return result;
          }),
        )),
        finalize(() => this.operation.set(null)),
      );
    });
  }

  updateEdition(edition: IAdminEventDetail): void {
    this.editionState.set(edition);
  }
}
