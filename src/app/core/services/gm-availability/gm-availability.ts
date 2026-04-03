import { inject, Injectable } from '@angular/core';
import { from, Observable, of, switchMap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { PostgrestResponse } from '@supabase/supabase-js';
import { IGmAvailabilitySlotRecord } from '../../interfaces/i-gm-availability';
import { IGmProfile } from '../../interfaces/i-gm-profile';
import { toCamelCase, toSnakeCase } from '../../utils/type-mappings';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';
import { Supabase } from '../supabase/supabase';

@Injectable({ providedIn: 'root' })
export class GmAvailability {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);
  private readonly supabase = inject(Supabase).client();

  getMyAvailability(
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<IGmAvailabilitySlotRecord[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return from(
      this.supabase
        .from('gm_availability_slots')
        .select('*')
        .eq('gm_profile_id', userId)
        .gte('starts_at', fromIso)
        .lt('starts_at', toIsoExclusive)
        .order('starts_at', { ascending: true }),
    ).pipe(
      map((response: PostgrestResponse<unknown>) => {
        if (response.error) {
          throw new Error(response.error.message);
        }

        return (response.data ?? []).map((record) =>
          toCamelCase<IGmAvailabilitySlotRecord>(record),
        );
      }),
    );
  }

  replaceMyAvailability(
    records: readonly IGmAvailabilitySlotRecord[],
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<IGmAvailabilitySlotRecord[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.ensureMyGmProfile().pipe(
      switchMap(() =>
        from(
          this.supabase
            .from('gm_availability_slots')
            .delete()
            .eq('gm_profile_id', userId)
            .gte('starts_at', fromIso)
            .lt('starts_at', toIsoExclusive),
        ).pipe(
          map((response) => {
            if (response.error) {
              throw new Error(response.error.message);
            }

            return void 0;
          }),
        ),
      ),
      switchMap(() => {
        if (!records.length) {
          return of([]);
        }

        return from(
          this.supabase
            .from('gm_availability_slots')
            .insert(this.toInsertPayload(records), { defaultToNull: false })
            .select('*')
            .order('starts_at', { ascending: true }),
        ).pipe(
          map((response: PostgrestResponse<unknown>) => {
            if (response.error) {
              throw new Error(response.error.message);
            }

            return (response.data ?? []).map((record) =>
              toCamelCase<IGmAvailabilitySlotRecord>(record),
            );
          }),
        );
      }),
    );
  }

  private ensureMyGmProfile(): Observable<IGmProfile> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.backend.upsert<Pick<IGmProfile, 'id'>>('gm_profiles', {
      id: userId,
    }) as Observable<IGmProfile>;
  }

  private toInsertPayload(
    records: readonly IGmAvailabilitySlotRecord[],
  ): object[] {
    return records.map(({ id, createdAt, updatedAt, ...record }) =>
      toSnakeCase(id ? { id, ...record } : record),
    );
  }
}
