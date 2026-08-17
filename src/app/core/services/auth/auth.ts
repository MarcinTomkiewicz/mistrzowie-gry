import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AuthChangeEvent,
  isAuthSessionMissingError,
  Session,
} from '@supabase/supabase-js';
import {
  catchError,
  finalize,
  from,
  map,
  Observable,
  of,
  shareReplay,
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
import { AuthSession } from '../auth-session/auth-session';
import { Backend } from '../backend/backend';
import { Platform } from '../platform/platform';
import { Supabase } from '../supabase/supabase';
import { AppRole } from '../../types/app-role';
import { AppAuthError } from '../../types/auth-error';
import { mapAuthError } from '../../utils/auth-error';
import { hasRole as userHasRole } from '../../utils/roles';
import { getUserDisplayName } from '../../utils/user-display';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly authSession = inject(AuthSession);
  private readonly backend = inject(Backend);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly supabase = inject(Supabase).client();

  private readonly _user = signal<IUser | null>(null);
  private readonly _isReady = signal(false);
  private principalId: string | null | undefined;
  private principalSyncOwner: object = {};
  private principalSync$: Observable<IUser | null> | null = null;

  readonly user = computed(() => this._user());
  readonly isReady = computed(() => this._isReady());
  readonly isAuthenticated = computed(() => !!this._user());
  readonly appRole = computed<AppRole | null>(
    () => this._user()?.appRole ?? null,
  );
  readonly userId = computed(() => this._user()?.id ?? null);

  readonly displayName = computed(() => {
    return getUserDisplayName(this._user());
  });

  constructor() {
    this.initializeAuth();
  }

  loadUser(): Observable<IUser | null> {
    return this.synchronizePrincipal();
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

        this.authSession.setHasSessionCookie(true);
        return this.synchronizePrincipal(id).pipe(
          switchMap((user) =>
            user
              ? of(user)
              : throwError(() => new AppAuthError('profile_not_found')),
          ),
        );
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

        const hasSession = !!data.session?.user?.id;
        this.authSession.setHasSessionCookie(hasSession);

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
            if (hasSession) {
              this.setAuthenticatedUser(user);
              return user;
            }

            this.clearPrincipal();
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
      tap((nextUser) => this.setAuthenticatedUser(nextUser)),
      catchError((error) => this.toErrorObservable(error)),
    );
  }

  logout(redirectTo: string = '/'): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      switchMap(({ error }) => {
        if (error) {
          throw mapAuthError(error);
        }

        this.clearPrincipal();

        return from(this.router.navigateByUrl(redirectTo)).pipe(
          map(() => void 0),
        );
      }),
      catchError((error) => this.toErrorObservable(error)),
    );
  }

  hasRole(role: AppRole): boolean {
    return userHasRole(this._user(), role);
  }

  private initializeAuth(): void {
    this.loadUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => undefined,
    });

    if (!this.platform.isBrowser) {
      return;
    }

    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        const principalId = session?.user.id ?? null;

        switch (event) {
          case 'SIGNED_IN':
          case 'USER_UPDATED':
            if (
              !principalId ||
              principalId === this._user()?.id ||
              (this.principalSync$ !== null && principalId === this.principalId)
            ) {
              break;
            }

            this.synchronizePrincipal(principalId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({ error: () => undefined });
            break;
          case 'SIGNED_OUT':
            this.clearPrincipal();
            break;
        }
      },
    );

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  private loadProfile(id: string): Observable<IUser | null> {
    return this.backend.getById<IUser>('users', id);
  }

  private synchronizePrincipal(
    principalId?: string,
  ): Observable<IUser | null> {
    if (
      this.principalSync$ !== null &&
      (principalId === undefined || principalId === this.principalId)
    ) {
      return this.principalSync$;
    }

    const owner = {};
    this.principalSyncOwner = owner;
    this.principalSync$ = null;
    this._isReady.set(false);

    if (principalId !== undefined) {
      if (principalId !== this.principalId) {
        this._user.set(null);
      }

      this.principalId = principalId;
      this.authSession.setHasSessionCookie(true);
    }

    const principal$ = principalId === undefined
      ? from(this.supabase.auth.getUser()).pipe(
          map(({ data, error }) => {
            if (isAuthSessionMissingError(error)) {
              return null;
            }

            if (error) {
              throw mapAuthError(error);
            }

            return data.user?.id ?? null;
          }),
        )
      : of(principalId);

    const sync$ = principal$.pipe(
      switchMap((nextPrincipalId) => {
        if (this.principalSyncOwner !== owner) {
          return of(this._user());
        }

        if (nextPrincipalId !== this.principalId) {
          this._user.set(null);
        }

        this.principalId = nextPrincipalId;
        this.authSession.setHasSessionCookie(nextPrincipalId !== null);

        return nextPrincipalId === null
          ? of(null)
          : this.loadProfile(nextPrincipalId);
      }),
      map((user) =>
        this.principalSyncOwner === owner ? user : this._user(),
      ),
      tap((user) => {
        if (this.principalSyncOwner === owner) {
          this._user.set(user);
          this._isReady.set(true);
        }
      }),
      catchError((error) => {
        if (this.principalSyncOwner !== owner) {
          return of(this._user());
        }

        const authError = error instanceof AppAuthError
          ? error
          : mapAuthError(error);

        this._user.set(null);
        this.authSession.refresh();
        return throwError(() => authError);
      }),
      finalize(() => {
        if (this.principalSyncOwner === owner) {
          this.principalSync$ = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.principalSync$ = sync$;
    return sync$;
  }

  private setAuthenticatedUser(user: IUser): void {
    this.principalSyncOwner = {};
    this.principalSync$ = null;
    this.principalId = user.id;
    this._user.set(user);
    this.authSession.setHasSessionCookie(true);
    this._isReady.set(true);
  }

  private clearPrincipal(): void {
    this.principalSyncOwner = {};
    this.principalSync$ = null;
    this.principalId = null;
    this._user.set(null);
    this.authSession.setHasSessionCookie(false);
    this._isReady.set(true);
  }

  private toErrorObservable(error: unknown): Observable<never> {
    if (error instanceof AppAuthError) {
      return throwError(() => error);
    }

    return throwError(() => mapAuthError(error));
  }
}
