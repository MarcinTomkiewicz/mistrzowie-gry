import { Component, computed, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ISessionWithRelations } from '../../../core/interfaces/i-session';
import { Storage } from '../../../core/services/storage/storage';
import { resolveAltDifficultyLevel } from '../../../core/utils/alt-difficulty-level';
import { normalizeText } from '../../../core/utils/normalize-text';
import { createSessionDetailsI18n } from './session-details.i18n';
import { SystemChip } from '../system-chip/system-chip';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [ButtonModule, ImageModule, SystemChip],
  templateUrl: './session-details.html',
  styleUrl: './session-details.scss',
  providers: [provideTranslocoScope('sessions')],
})
export class SessionDetails {
  private readonly storage = inject(Storage);

  readonly session = input.required<ISessionWithRelations>();
  readonly gmDisplayName = input<string | null>(null);
  readonly canOpenGmProfile = input(false);
  readonly isGmProfileLoading = input(false);

  readonly gmProfileSelect = output<void>();

  readonly i18n = createSessionDetailsI18n();

  readonly imageUrl = computed(() => {
    const imagePath = normalizeText(this.session().image);

    if (!imagePath) {
      return null;
    }

    return this.storage.getPublicUrl(imagePath);
  });

  readonly systemName = computed(
    () =>
      normalizeText(this.session().system?.name) ??
      this.i18n.commonFallbacks().missingData,
  );

  readonly difficultyLabel = computed(() => {
    const difficultyVm = resolveAltDifficultyLevel(
      this.session().difficultyLevel,
      this.i18n.difficulty(),
      this.i18n.commonFallbacks().missingData,
    );

    return difficultyVm.label;
  });

  readonly difficultyBadgeClass = computed(() => {
    const difficultyVm = resolveAltDifficultyLevel(
      this.session().difficultyLevel,
      this.i18n.difficulty(),
      this.i18n.commonFallbacks().missingData,
    );

    return difficultyVm.badgeClass;
  });

  readonly playersLabel = computed(() => {
    const { minPlayers, maxPlayers } = this.session();

    if (minPlayers == null && maxPlayers == null) {
      return this.i18n.commonFallbacks().missingData;
    }

    if (minPlayers === maxPlayers) {
      return `${minPlayers}`;
    }

    if (minPlayers != null && maxPlayers != null) {
      return `${minPlayers}-${maxPlayers}`;
    }

    return `${minPlayers ?? maxPlayers}`;
  });

  readonly minAgeLabel = computed(() => {
    const minAge = this.session().minAge;

    if (minAge == null) {
      return this.i18n.commonFallbacks().missingData;
    }

    return `${minAge}+`;
  });

  readonly resolvedGmDisplayName = computed(() => {
    const displayName = normalizeText(this.gmDisplayName());

    if (displayName) {
      return displayName;
    }

    if (this.isGmProfileLoading()) {
      return '...';
    }

    return this.i18n.commonFallbacks().missingData;
  });

  onGmProfileSelect(): void {
    if (!this.canOpenGmProfile()) {
      return;
    }

    this.gmProfileSelect.emit();
  }
}
