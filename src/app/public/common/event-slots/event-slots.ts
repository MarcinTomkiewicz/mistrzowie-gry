import { Component, computed, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { IEventSlotCardVm } from '../../../core/interfaces/i-event-slot-card';
import { Theme } from '../../../core/services/theme/theme';
import { SessionDifficultyLevel } from '../../../core/types/sessions';
import { createEventSlotsI18n } from './event-slots.i18n';

@Component({
  selector: 'app-event-slots',
  standalone: true,
  imports: [ButtonModule, SkeletonModule],
  templateUrl: './event-slots.html',
  styleUrl: './event-slots.scss',
})
export class EventSlots {
  private readonly theme = inject(Theme);

  readonly items = input<IEventSlotCardVm[]>([]);
  readonly slotCount = input<number>(0);
  readonly isLoading = input<boolean>(false);

  readonly slotSelect = output<IEventSlotCardVm>();
  readonly gmSelect = output<IEventSlotCardVm>();

  readonly placeholderImageSrc = '/logo/logoMG-transparent.png';
  readonly i18n = createEventSlotsI18n();

  readonly styleBadgeClass = computed(() =>
    this.theme.isLight() ? 'tag-badge--primary' : 'tag-badge--golden',
  );

  readonly displayItems = computed<IEventSlotCardVm[]>(() => {
    const items = this.items() ?? [];
    const slotCount = Math.max(0, this.slotCount() ?? 0);

    if (!slotCount) {
      return items;
    }

    if (items.length >= slotCount) {
      return items.slice(0, slotCount);
    }

    const missingCount = slotCount - items.length;
    const placeholders = Array.from({ length: missingCount }, (_, index) =>
      this.createEmptySlot(index),
    );

    return [...items, ...placeholders];
  });

  readonly skeletonItems = computed(() =>
    Array.from(
      { length: Math.max(1, this.slotCount() || 3) },
      (_, index) => index,
    ),
  );

  resolveImageSrc(item: IEventSlotCardVm): string {
    return item.imageUrl || this.placeholderImageSrc;
  }

  onSlotClick(item: IEventSlotCardVm): void {
    if (!item.canOpenDetails || item.isEmpty) {
      return;
    }

    this.slotSelect.emit(item);
  }

  onSlotKeydown(event: KeyboardEvent, item: IEventSlotCardVm): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onSlotClick(item);
  }

  onGmClick(event: Event, item: IEventSlotCardVm): void {
    event.stopPropagation();

    if (!item.canOpenGmProfile || item.isEmpty) {
      return;
    }

    this.gmSelect.emit(item);
  }

  difficultyBadgeClass(
    difficulty: SessionDifficultyLevel | null | undefined,
  ): string {
    switch (difficulty) {
      case SessionDifficultyLevel.Beginner:
        return 'tag-badge--success';
      case SessionDifficultyLevel.Intermediate:
        return 'tag-badge--arcane';
      case SessionDifficultyLevel.Advanced:
        return 'tag-badge--danger';
      default:
        return 'tag-badge--muted';
    }
  }

  difficultyLabel(
    difficulty: SessionDifficultyLevel | null | undefined,
  ): string {
    if (!difficulty) {
      return this.i18n.commonFallbacks().missingData;
    }

    return (
      this.i18n.difficulty()[difficulty] ??
      this.i18n.commonFallbacks().missingData
    );
  }

  trackBySlot(index: number, item: IEventSlotCardVm): string {
    return item.id ?? `empty-${index}`;
  }

  private createEmptySlot(_index: number): IEventSlotCardVm {
    const fallback = this.i18n.commonFallbacks();

    return {
      id: null,
      gmProfileId: null,
      title: fallback.emptySession,
      imageUrl: null,
      gmDisplayName: fallback.none,
      difficultyLevel: null,
      styles: [],
      triggers: [],
      minAge: null,
      description: null,
      isEmpty: true,
      canOpenDetails: false,
      canOpenGmProfile: false,
    };
  }
}
