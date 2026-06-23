import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
import { FilterOperator } from '../../enums/filter-operators';
import {
  ICustomerSessionEntitlement,
  ICustomerSessionEntitlementLookup,
} from '../../interfaces/i-customer-session-entitlement';
import { FilterDefinition } from '../../interfaces/i-filter';
import { IGmPublicProfile } from '../../interfaces/i-gm-public-profile';
import { ISessionBookingProduct } from '../../interfaces/i-session-booking-product';
import {
  ICreateSessionReservationPayload,
  ISessionReservation,
} from '../../interfaces/i-session-reservation';
import { ISession } from '../../interfaces/i-session';
import { ISystem } from '../../interfaces/i-system';
import { CUSTOMER_SESSION_ENTITLEMENT_STATUSES } from '../../types/customer-session-entitlement';
import { SessionBookingProductSlug } from '../../types/session-booking-product';
import { GmRead } from '../gm-read/gm-read';
import { Backend } from '../backend/backend';
import { SessionSourceKind, SESSION_SOURCE_CONFIG } from '../../types/session-source';

@Injectable({ providedIn: 'root' })
export class SessionReservationService {
  private readonly backend = inject(Backend);
  private readonly gmRead = inject(GmRead);

  getActiveSystems(): Observable<ISystem[]> {
    return this.getVisibleGms().pipe(
      switchMap((gms) => {
        const gmProfileIds = gms.map((gm) => gm.profile.id);

        if (!gmProfileIds.length) {
          return of([] as ISystem[]);
        }

        return forkJoin([
          this.getSystemIdsForGms(gmProfileIds, 'template'),
          this.getSystemIdsForGms(gmProfileIds, 'custom'),
        ]).pipe(
          switchMap(([templateSystemIds, customSystemIds]) => {
            const systemIds = [
              ...new Set([...templateSystemIds, ...customSystemIds].filter(Boolean)),
            ];

            if (!systemIds.length) {
              return of([] as ISystem[]);
            }

            return this.backend.getByIds<ISystem>('systems', systemIds).pipe(
              map((systems) =>
                [...systems].sort((left, right) =>
                  left.name.localeCompare(right.name, 'pl'),
                ),
              ),
            );
          }),
        );
      }),
    );
  }

  getVisibleGms(): Observable<IGmPublicProfile[]> {
    return this.gmRead.getPublicProfiles();
  }

  getActiveBookingProducts(): Observable<ISessionBookingProduct[]> {
    return this.backend.getAll<ISessionBookingProduct>({
      table: 'session_booking_products',
      sortBy: 'sortOrder',
      sortOrder: 'asc',
      pagination: {
        filters: {
          isPublic: {
            operator: FilterOperator.EQ,
            value: true,
          },
          isActive: {
            operator: FilterOperator.EQ,
            value: true,
          },
        },
      },
    });
  }

  getBookingProductBySlug(
    slug: SessionBookingProductSlug,
  ): Observable<ISessionBookingProduct | null> {
    return this.backend.getBySlug<ISessionBookingProduct>(
      'session_booking_products',
      slug,
    );
  }

  getCustomerEntitlements(
    customer: ICustomerSessionEntitlementLookup,
  ): Observable<ICustomerSessionEntitlement[]> {
    const nowIso = new Date().toISOString();
    const filters: Record<string, FilterDefinition> = {
      status: {
        operator: FilterOperator.EQ,
        value: CUSTOMER_SESSION_ENTITLEMENT_STATUSES.Active,
      },
    };

    if (customer.userId !== undefined && customer.userId !== null) {
      filters['userId'] = {
        operator: FilterOperator.EQ,
        value: customer.userId,
      };
    } else {
      filters['customerEmail'] = {
        operator: FilterOperator.EQ,
        value: customer.customerEmail,
      };
    }

    return this.backend.getAll<ICustomerSessionEntitlement>({
      table: 'customer_session_entitlements',
      sortBy: 'validFrom',
      sortOrder: 'desc',
      pagination: {
        filters,
      },
    }).pipe(
      map((entitlements) =>
        entitlements.filter(
          (entitlement) =>
            entitlement.validFrom <= nowIso &&
            (!entitlement.validTo || entitlement.validTo >= nowIso),
        ),
      ),
    );
  }

  getSystemsForGm(gmProfileId: string): Observable<ISystem[]> {
    return forkJoin([
      this.getSystemIdsForGm(gmProfileId, 'template'),
      this.getSystemIdsForGm(gmProfileId, 'custom'),
    ]).pipe(
      switchMap(([templateSystemIds, customSystemIds]) => {
        const systemIds = [
          ...new Set([...templateSystemIds, ...customSystemIds].filter(Boolean)),
        ];

        if (!systemIds.length) {
          return of([] as ISystem[]);
        }

        return this.backend.getByIds<ISystem>('systems', systemIds).pipe(
          map((systems) =>
            [...systems].sort((left, right) =>
              left.name.localeCompare(right.name, 'pl'),
            ),
          ),
        );
      }),
    );
  }

  getGmsForSystem(systemId: string): Observable<IGmPublicProfile[]> {
    return forkJoin([
      this.getGmIdsForSystem(systemId, 'template'),
      this.getGmIdsForSystem(systemId, 'custom'),
      this.getVisibleGms(),
    ]).pipe(
      map(([templateGmIds, customGmIds, gms]) => {
        const gmIds = new Set([...templateGmIds, ...customGmIds]);

        return gms.filter((gm) => gmIds.has(gm.profile.id));
      }),
    );
  }

  getBlockingReservationsForGm(
    gmProfileId: string,
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<ISessionReservation[]> {
    return this.getBlockingReservationsForGms(
      [gmProfileId],
      fromIso,
      toIsoExclusive,
    );
  }

  getBlockingReservationsForGms(
    gmProfileIds: readonly string[],
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<ISessionReservation[]> {
    if (!gmProfileIds.length) {
      return of([] as ISessionReservation[]);
    }

    return this.backend.getAll<ISessionReservation>({
      table: 'session_reservations',
      sortBy: 'startsAt',
      sortOrder: 'asc',
      pagination: {
        filters: {
          gmProfileId: {
            operator: FilterOperator.IN,
            value: [...gmProfileIds],
          },
          status: {
            operator: FilterOperator.IN,
            value: [...SESSION_RESERVATION_CONFIG.blockingReservationStatuses],
          },
          startsAt: {
            operator: FilterOperator.LT,
            value: toIsoExclusive,
          },
          endsAt: {
            operator: FilterOperator.GT,
            value: fromIso,
          },
        },
      },
    });
  }

  createSessionReservation(
    payload: ICreateSessionReservationPayload,
  ): Observable<ISessionReservation> {
    return this.backend.create<
      ISessionReservation,
      ICreateSessionReservationPayload
    >('session_reservations', payload);
  }

  private getSystemIdsForGm(
    gmProfileId: string,
    source: SessionSourceKind,
  ): Observable<string[]> {
    return this.getSystemIdsForGms([gmProfileId], source);
  }

  private getSystemIdsForGms(
    gmProfileIds: readonly string[],
    source: SessionSourceKind,
  ): Observable<string[]> {
    if (!gmProfileIds.length) {
      return of([]);
    }

    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend
      .getAll<Pick<ISession, 'systemId'>>({
        table: config.sessionsTable,
        pagination: {
          filters: {
            gmProfileId: {
              operator: FilterOperator.IN,
              value: [...gmProfileIds],
            },
          },
        },
      })
      .pipe(
        map((sessions) => [
          ...new Set(sessions.map((session) => session.systemId).filter(Boolean)),
        ]),
      );
  }

  private getGmIdsForSystem(
    systemId: string,
    source: SessionSourceKind,
  ): Observable<string[]> {
    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend
      .getAll<Pick<ISession, 'gmProfileId'>>({
        table: config.sessionsTable,
        pagination: {
          filters: {
            systemId: {
              operator: FilterOperator.EQ,
              value: systemId,
            },
          },
        },
      })
      .pipe(
        map((sessions) => [
          ...new Set(
            sessions.map((session) => session.gmProfileId).filter(Boolean),
          ),
        ]),
      );
  }
}
