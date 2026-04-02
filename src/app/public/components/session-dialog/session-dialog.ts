import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';
import { catchError, finalize, of } from 'rxjs';

import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { ISessionWithRelations } from '../../../core/interfaces/i-session';
import { GmRead } from '../../../core/services/gm-read/gm-read';
import { normalizeText } from '../../../core/utils/normalize-text';
import { SessionDetails } from '../../common/session-details/session-details';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { createSessionDialogI18n } from './session-dialog.i18n';

@Component({
  selector: 'app-session-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    SessionDetails,
    GmProfileDialog,
  ],
  templateUrl: './session-dialog.html',
  styleUrl: './session-dialog.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class SessionDialog {
  private readonly gmRead = inject(GmRead);

  readonly visible = input(false);
  readonly session = input<ISessionWithRelations | null>(null);
  readonly gmProfile = input<IGmPublicProfile | null>(null);
  readonly gmProfileId = input<string | null>(null);
  readonly gmDisplayName = input<string | null>(null);

  readonly visibleChange = output<boolean>();

  readonly i18n = createSessionDialogI18n();

  readonly selectedProfile = signal<IGmPublicProfile | null>(null);
  readonly isGmDialogVisible = signal(false);
  readonly isGmProfileLoading = signal(false);

  readonly header = computed(() => this.session()?.title ?? '');
  readonly resolvedGmDisplayName = computed(() => {
    const explicitDisplayName = normalizeText(this.gmDisplayName());

    if (explicitDisplayName) {
      return explicitDisplayName;
    }

    const profile = this.selectedProfile();

    if (!profile) {
      return null;
    }

    return this.gmRead.getDisplayName(profile) || null;
  });

  readonly canOpenGmProfile = computed(() => !!this.selectedProfile()?.profile.id);

  constructor() {
    effect((onCleanup) => {
      const isVisible = this.visible();
      const initialProfile = this.gmProfile();
      const gmProfileId =
        normalizeText(this.gmProfileId()) ??
        normalizeText(this.session()?.gmProfileId);

      this.selectedProfile.set(initialProfile);
      this.isGmDialogVisible.set(false);
      this.isGmProfileLoading.set(false);

      if (!isVisible || initialProfile) {
        return;
      }

      if (!gmProfileId) {
        return;
      }

      this.isGmProfileLoading.set(true);

      const subscription = this.gmRead
        .getPublicProfileById(gmProfileId)
        .pipe(
          catchError(() => of(null as IGmPublicProfile | null)),
          finalize(() => this.isGmProfileLoading.set(false)),
        )
        .subscribe((profile) => {
          this.selectedProfile.set(profile);
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  onVisibleChange(next: boolean): void {
    if (!next) {
      this.resetState();
    }

    this.visibleChange.emit(next);
  }

  close(): void {
    this.resetState();
    this.visibleChange.emit(false);
  }

  openGmProfile(): void {
    if (!this.selectedProfile()) {
      return;
    }

    this.isGmDialogVisible.set(true);
  }

  onGmDialogVisibleChange(visible: boolean): void {
    this.isGmDialogVisible.set(visible);
  }

  private resetState(): void {
    this.isGmDialogVisible.set(false);
  }
}
