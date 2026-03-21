import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  catchError,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import {
  ILoginPayload,
  IRegisterPayload,
  IUpdateUserProfilePayload,
} from '../../interfaces/i-auth-payloads';
import { IUser } from '../../interfaces/i-user';
import { Backend } from '../backend/backend';
import { Platform } from '../platform/platform';
import { Supabase } from '../supabase/supabase';
import { AppRole } from '../../types/app-role';
import { AppAuthError } from '../../types/auth-error';
import { mapAuthError } from '../../utils/auth-error';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly backend = inject(Backend);
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly supabase = inject(Supabase).client();

  private readonly _user = signal<IUser | null>(null);

  readonly user = computed(() => this._user());
  readonly isAuthenticated = computed(() => !!this._user());
  readonly appRole = computed<AppRole | null>(() => this._user()?.appRole ?? null);
  readonly userId = computed(() => this._user()?.id ?? null);

  readonly displayName = computed(() => {
    const user = this._user();

    if (!user) {
      return '';
    }

    if (user.useNickname && user.nickname) {
      return user.nickname;
    }

    return user.firstName ?? user.nickname ?? '';
  });

  constructor() {
    if (!this.platform.isBrowser) {
      return;
    }

    void this.loadUser().subscribe();

    this.supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, _session: Session | null) => {
        void this.loadUser().subscribe();
      },
    );
  }

  loadUser(): Observable<IUser | null> {
    return from(this.supabase.auth.getSession()).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          throw mapAuthError(error);
        }

        const id = data.session?.user?.id;

        if (!id) {
          this._user.set(null);
          return of(null);
        }

        return this.loadProfile(id);
      }),
      catchError(() => {
        this._user.set(null);
        return of(null);
      }),
    );
  }

  login(payload: ILoginPayload): Observable<IUser> {
    return from(
      this.supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      }),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          throw mapAuthError(error);
        }

        const id = data.user?.id;

        if (!id) {
          throw new AppAuthError('user_not_found');
        }

        return this.loadProfileRequired(id);
      }),
      catchError((error) => this.toErrorObservable(error)),
    );
  }

  register(payload: IRegisterPayload): Observable<IUser | null> {
    return from(
      this.supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
      }),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          throw mapAuthError(error);
        }

        const id = data.user?.id;

        if (!id) {
          throw new AppAuthError('user_not_found');
        }

        const userPayload: IUser = {
          id,
          email: payload.email,
          appRole: 'user',
          firstName: payload.profile.firstName,
          phoneNumber: payload.profile.phoneNumber,
          city: payload.profile.city,
          street: payload.profile.street,
          houseNumber: payload.profile.houseNumber,
          apartmentNumber: payload.profile.apartmentNumber,
          postalCode: payload.profile.postalCode,
          age: payload.profile.age,
          shortDescription: payload.profile.shortDescription,
          longDescription: payload.profile.longDescription,
          extendedDescription: payload.profile.extendedDescription,
          nickname: payload.profile.nickname,
          useNickname: payload.profile.useNickname,
          isTestUser: false,
          createdAt: null,
          updatedAt: null,
        };

        return this.backend.upsert<IUser>('users', userPayload).pipe(
          map((user) => {
            if (data.session?.user?.id) {
              this._user.set(user);
              return user;
            }

            this._user.set(null);
            return null;
          }),
        );
      }),
      catchError((error) => this.toErrorObservable(error)),
    );
  }

  updateProfile(payload: IUpdateUserProfilePayload): Observable<IUser> {
    const user = this._user();

    if (!user) {
      return throwError(() => new AppAuthError('unauthorized'));
    }

    return this.backend.update<IUser>('users', user.id, payload).pipe(
      tap((nextUser) => this._user.set(nextUser)),
      catchError((error) => this.toErrorObservable(error)),
    );
  }

  logout(redirectTo: string = '/'): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      switchMap(({ error }) => {
        if (error) {
          throw mapAuthError(error);
        }

        this._user.set(null);

        return from(this.router.navigateByUrl(redirectTo)).pipe(
          map(() => void 0),
        );
      }),
      catchError((error) => this.toErrorObservable(error)),
    );
  }

  hasRole(role: AppRole): boolean {
    return this._user()?.appRole === role;
  }

  private loadProfile(id: string): Observable<IUser | null> {
    return this.backend.getById<IUser>('users', id).pipe(
      tap((user) => this._user.set(user)),
      catchError(() => {
        this._user.set(null);
        return of(null);
      }),
    );
  }

  private loadProfileRequired(id: string): Observable<IUser> {
    return this.loadProfile(id).pipe(
      switchMap((user) => {
        if (!user) {
          return throwError(() => new AppAuthError('profile_not_found'));
        }

        return of(user);
      }),
    );
  }

  private toErrorObservable(error: unknown): Observable<never> {
    if (error instanceof AppAuthError) {
      return throwError(() => error);
    }

    return throwError(() => mapAuthError(error));
  }
}