import { afterNextRender, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { forkJoin, map } from 'rxjs';

import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import type { IAdminEventDetail, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { assertAdminEventTimelineScope } from '../../../../core/reads/events/admin-event-timeline.contract';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';

// Historical Editions use canonical admin GETs without exposing any writer.
@Injectable()
export class EventEditionHistory {
  private readonly admin = inject(EventAdmin);
  private readonly browserReady = signal(false);
  private readonly selection = signal<{ core: IEventCoreDetail; editionId: string } | null>(null);
  private readonly attempt = signal(0);
  readonly edition = signal<IAdminEventDetail | null>(null);
  readonly timeline = signal<AdminEventTimeline | null>(null);
  readonly loading = signal(false);
  readonly error = signal<unknown | null>(null);

  constructor() {
    afterNextRender(() => this.browserReady.set(true));
    effect(onCleanup => {
      const ready = this.browserReady();
      const selection = this.selection();
      this.attempt();
      untracked(() => {
        this.edition.set(null);
        this.timeline.set(null);
        this.error.set(null);
        this.loading.set(!!selection);
        if (!ready || !selection) return;
        const { core, editionId } = selection;
        const subscription = forkJoin({
          edition: this.admin.getEditionDetail(editionId),
          timeline: this.admin.getTimeline(editionId),
        }).pipe(map(({ edition, timeline }) => {
          const summary = core.editions.find(row => row.id === editionId);
          assertEdgeContract(edition !== null && summary !== undefined && edition.id === editionId &&
            edition.eventCoreId === core.id && edition.city === summary.city && edition.slug === summary.slug,
          'eventHistory.edition', 'the selected saved Edition belonging to the displayed Core');
          assertAdminEventTimelineScope(timeline, edition, core.id);
          return { edition, timeline };
        })).subscribe({
          next: result => {
            this.edition.set(result.edition);
            this.timeline.set(result.timeline);
            this.loading.set(false);
          },
          error: (error: unknown) => { this.error.set(error); this.loading.set(false); },
        });
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  selectedEditionId(): string | null { return this.selection()?.editionId ?? null; }

  open(core: IEventCoreDetail, editionId = this.selectedEditionId()): void {
    const selected = core.editions.find(row => row.id === editionId) ?? core.editions[0];
    this.selection.set(selected ? { core, editionId: selected.id } : null);
  }

  refresh(): void {
    if (this.loading()) return;
    this.attempt.update(value => value + 1);
  }

  reset(): void { this.selection.set(null); }
}
