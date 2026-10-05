import { DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, Subscription } from 'rxjs';

import type { ISessionWithRelations } from '../../interfaces/i-session';
import { Auth } from '../../services/auth/auth';
import { GmSessions } from '../../services/gm-sessions/gm-sessions';
import type { SessionSourceKind } from '../../types/session-source';

@Injectable({ providedIn: 'root' })
export class StaffingSessionSelectorFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly gmSessions = inject(GmSessions);
  private readonly auth = inject(Auth);
  private currentUserId = this.auth.userId();
  private loaded = false;
  private request: Subscription | null = null;
  private readonly sessionsSource = signal<Record<SessionSourceKind, ISessionWithRelations[]>>({
    template: [],
    custom: [],
  });

  readonly sessions = this.sessionsSource.asReadonly();
  readonly isLoading = signal(false);
  readonly loadFailed = signal(false);

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId === this.currentUserId) return;
      untracked(() => {
        this.currentUserId = userId;
        this.request?.unsubscribe();
        this.request = null;
        this.loaded = false;
        this.sessionsSource.set({ template: [], custom: [] });
        this.loadFailed.set(false);
        if (userId) this.load();
      });
    });
  }

  load(): void {
    if (this.loaded || this.isLoading()) return;
    this.isLoading.set(true);
    this.loadFailed.set(false);

    this.request = forkJoin({
      template: this.gmSessions.getMySessions('template'),
      custom: this.gmSessions.getMySessions('custom'),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: sessions => {
        this.sessionsSource.set(sessions);
        this.loaded = true;
      },
      error: () => this.loadFailed.set(true),
    });
  }
}
