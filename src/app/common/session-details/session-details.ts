import { Component, computed, inject, input, signal } from '@angular/core';

import { ImageModule } from 'primeng/image';

import { provideTranslocoScope } from '@jsverse/transloco';

import type { SessionDetailsData } from '../../core/interfaces/i-session';
import type { IEventSlotCardVm } from '../../core/interfaces/i-event-slot-card';
import type { IPdfPreview } from '../../core/interfaces/i-pdf';
import { Storage } from '../../core/services/storage/storage';
import { resolveAltDifficultyLevel } from '../session-difficulty/session-difficulty';
import { resolvePublicStorageUrl } from '../../core/utils/storage-url';
import { PdfThumbnail } from '../pdf-thumbnail/pdf-thumbnail';
import { PdfViewerDialog } from '../pdf-viewer-dialog/pdf-viewer-dialog';
import { createSessionDetailsI18n } from './session-details.i18n';
import { SystemChip } from '../system-chip/system-chip';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [ImageModule, PdfThumbnail, PdfViewerDialog, SystemChip],
  templateUrl: './session-details.html',
  styleUrl: './session-details.scss',
  providers: [provideTranslocoScope('sessions', 'common')],
})
export class SessionDetails {
  private readonly storage = inject(Storage);

  readonly session = input.required<SessionDetailsData>();
  readonly eventCapacity = input<IEventSlotCardVm['eventCapacity']>();
  readonly gmDisplayName = input<string | null>(null);
  readonly enablePdfPreviews = input(true);
  readonly showCharacterSheets = input(true);

  readonly i18n = createSessionDetailsI18n();
  readonly characterSheetPreview = signal<IPdfPreview | null>(null);

  readonly imageUrl = computed(() => resolvePublicStorageUrl(this.storage, this.session().image));

  readonly difficulty = computed(() => resolveAltDifficultyLevel(
    this.session().difficultyLevel, this.i18n.difficulty(), this.i18n.commonEmpty().title,
  ));

  readonly playersLabel = computed(() => {
    const { minPlayers } = this.session();
    const event = this.eventCapacity();
    const maxPlayers = event ? event.gmDeclaredMaxPlayers : this.session().maxPlayers;

    if (minPlayers == null && maxPlayers == null) {
      return this.i18n.commonEmpty().title;
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
      return this.i18n.commonEmpty().title;
    }

    return `${minAge}+`;
  });

  resolveCharacterSheetUrl(path: string): string | null {
    return this.storage.getPublicUrl(path, 'docs');
  }
}
