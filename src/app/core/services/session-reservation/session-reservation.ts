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
  ISessionReservation,
} from '../../interfaces/i-session-reservation';
import { ISession } from '../../interfaces/i-session';
import { ISystem } from '../../interfaces/i-system';
import { CUSTOMER_SESSION_ENTITLEMENT_STATUSES } from '../../types/customer-session-entitlement';
import { SessionBookingProductSlug } from '../../types/session-booking-product';
import { SessionReservationCreatePayload } from '../../types/session-reservation-create-payload';
import { GmRead } from '../gm-read/gm-read';
import { Backend } from '../backend/backend';
import { Auth } from '../auth/auth';
import { hasMinimumRole } from '../../utils/roles';

@Injectable({ providedIn: 'root' })
export class SessionReservationService {
  private readonly backend = inject(Backend);
  private readonly gmRead = inject(GmRead);
  private readonly auth = inject(Auth);

  getActiveSystems(): Observable<ISystem[]> {
    return this.getVisibleGms().pipe(
      switchMap((gms) => {
        const gmProfileIds = gms.map((gm) => gm.profile.id);

        return this.getTemplateSystemIdsForGms(gmProfileIds).pipe(
          switchMap((systemIds) => this.getSystemsByIds(systemIds)),
        );
      }),
    );
  }

  getVisibleGms(): Observable<IGmPublicProfile[]> {
    if (hasMinimumRole(this.auth.user(), 'customer_manager')) {
      return this.gmRead.getNonArchivedProfiles();
    }

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
    return this.getTemplateSystemIdsForGm(gmProfileId).pipe(
      switchMap((systemIds) => this.getSystemsByIds(systemIds)),
    );
  }

  getGmsForSystem(systemId: string): Observable<IGmPublicProfile[]> {
    return forkJoin({
      gmIds: this.getTemplateGmIdsForSystem(systemId),
      gms: this.getVisibleGms(),
    }).pipe(
      map(({ gmIds, gms }) => {
        const availableGmIds = new Set(gmIds);

        return gms.filter((gm) => availableGmIds.has(gm.profile.id));
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
    payload: SessionReservationCreatePayload,
  ): Observable<ISessionReservation> {
    return this.backend.create<
      ISessionReservation,
      SessionReservationCreatePayload
    >('session_reservations', payload);
  }

  private getTemplateSystemIdsForGm(
    gmProfileId: string,
  ): Observable<string[]> {
    return this.getTemplateSystemIdsForGms([gmProfileId]);
  }

  private getTemplateSystemIdsForGms(
    gmProfileIds: readonly string[],
  ): Observable<string[]> {
    if (!gmProfileIds.length) {
      return of([]);
    }

    return this.backend
      .getAll<Pick<ISession, 'systemId'>>({
        table: 'gm_session_templates',
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

  private getTemplateGmIdsForSystem(
    systemId: string,
  ): Observable<string[]> {
    return this.backend
      .getAll<Pick<ISession, 'gmProfileId'>>({
        table: 'gm_session_templates',
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

  private getSystemsByIds(systemIds: readonly string[]): Observable<ISystem[]> {
    if (!systemIds.length) {
      return of([] as ISystem[]);
    }

    return this.backend.getByIds<ISystem>('systems', [...systemIds]).pipe(
      map((systems) =>
        [...systems].sort((left, right) =>
          left.name.localeCompare(right.name, 'pl'),
        ),
      ),
    );
  }
}
