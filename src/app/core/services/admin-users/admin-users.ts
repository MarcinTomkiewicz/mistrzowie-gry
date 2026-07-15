import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  IAdminGmProfileCreatePayload,
  IAdminGmProfileStatusPatch,
  IAdminUserRecord,
  IAdminUserRow,
  IAdminUserUpdateFormValue,
  IAdminUserUpdatePayload,
  AdminUsersSortField,
  AdminUsersSortOrder,
} from '../../types/admin-users';
import { IGmProfile } from '../../interfaces/i-gm-profile';
import { IUser } from '../../interfaces/i-user';
import { normalizeText } from '../../utils/normalize-text';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class AdminUsers {
  private readonly backend = inject(Backend);

  getUsers(
    sortBy: AdminUsersSortField = 'createdAt',
    sortOrder: AdminUsersSortOrder = 'desc',
  ): Observable<IAdminUserRow[]> {
    return this.backend
      .getAll<IAdminUserRecord>({
        table: 'users',
        joins: 'gm_profiles(*)',
        sortBy,
        sortOrder,
      })
      .pipe(map((records) => records.map((record) => this.toRow(record))));
  }

  updateUser(
    userId: string,
    value: IAdminUserUpdateFormValue,
  ): Observable<IUser> {
    return this.backend.update<IUser>(
      'users',
      userId,
      this.toUserUpdatePayload(value),
    );
  }

  createGmProfile(userId: string): Observable<IAdminGmProfileCreatePayload> {
    const payload: IAdminGmProfileCreatePayload = {
      id: userId,
      isPublic: false,
      isArchived: false,
    };

    return this.backend.create<IAdminGmProfileCreatePayload>(
      'gm_profiles',
      payload,
    );
  }

  updateGmProfileStatus(
    userId: string,
    patch: IAdminGmProfileStatusPatch,
  ): Observable<IGmProfile> {
    return this.backend.update<IGmProfile>(
      'gm_profiles',
      userId,
      this.normalizeGmProfileStatusPatch(patch),
    );
  }

  private toRow(record: IAdminUserRecord): IAdminUserRow {
    const { gmProfiles, ...user } = record;

    return {
      user,
      gmProfile: this.normalizeGmProfile(gmProfiles),
    };
  }

  private normalizeGmProfile(
    value: IAdminUserRecord['gmProfiles'],
  ): IGmProfile | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }

  private toUserUpdatePayload(
    value: IAdminUserUpdateFormValue,
  ): IAdminUserUpdatePayload {
    return {
      appRole: value.appRole,
      firstName: normalizeText(value.firstName),
      nickname: normalizeText(value.nickname),
      useNickname: !!value.useNickname,
      phoneNumber: normalizeText(value.phoneNumber),
      city: normalizeText(value.city),
      isTestUser: !!value.isTestUser,
    };
  }

  private normalizeGmProfileStatusPatch(
    patch: IAdminGmProfileStatusPatch,
  ): IAdminGmProfileStatusPatch {
    if (patch.isArchived === true) {
      return {
        ...patch,
        isPublic: false,
      };
    }

    if (patch.isPublic === true) {
      return {
        ...patch,
        isArchived: false,
      };
    }

    return patch;
  }
}
