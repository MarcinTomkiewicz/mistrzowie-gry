import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ISessionWithRelations } from '../../../core/interfaces/i-session';
import { Storage } from '../../../core/services/storage/storage';
import { normalizeText } from '../../../core/utils/normalize-text';
import { createSessionDetailsI18n } from './session-details.i18n';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-details.html',
  styleUrl: './session-details.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class SessionDetails {
  private readonly storage = inject(Storage);

  readonly session = input.required<ISessionWithRelations>();

  readonly i18n = createSessionDetailsI18n();

  readonly imageUrl = computed(() => {
    const imagePath = normalizeText(this.session().image);

    if (!imagePath) {
      return null;
    }

    return this.storage.getPublicUrl(imagePath);
  });
}