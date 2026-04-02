import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { provideTranslocoScope } from '@jsverse/transloco';

import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import {
  GM_PROFILE_DIALOG_TABS,
  GmProfileDialogTabDefinition,
  GmProfileDialogTabId,
} from '../../../core/types/gm-dialog';
import { SessionDifficultyLevel } from '../../../core/types/sessions';
import { GmRead } from '../../../core/services/gm-read/gm-read';
import { Storage } from '../../../core/services/storage/storage';
import { normalizeText } from '../../../core/utils/normalize-text';
import { SessionList } from '../../common/session-list/session-list';
import { createGmProfileDialogI18n } from './gm-profile-dialog.i18n';
import { ISessionListLabels } from '../../../core/interfaces/i-session';

interface IGmProfileDialogTabOption {
  value: GmProfileDialogTabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-gm-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    TabsModule,
    SessionList,
  ],
  templateUrl: './gm-profile-dialog.html',
  styleUrl: './gm-profile-dialog.scss',
  providers: [provideTranslocoScope('ourTeam', 'common', 'sessions')],
})
export class GmProfileDialog {
  private readonly gmRead = inject(GmRead);
  private readonly storage = inject(Storage);

  readonly visible = input(false);
  readonly profile = input<IGmPublicProfile | null>(null);

  readonly visibleChange = output<boolean>();

  readonly i18n = createGmProfileDialogI18n();
  readonly placeholderImageSrc = '/logo/logoMG-transparent.png';

  readonly tabs = computed(() =>
    [...GM_PROFILE_DIALOG_TABS].sort((a, b) => a.order - b.order),
  );

  readonly tabOptions = computed<IGmProfileDialogTabOption[]>(() =>
    this.tabs().map((tab) => ({
      value: tab.id,
      label: this.resolveTabLabel(tab.id),
      icon: tab.icon,
    })),
  );

  readonly activeTab = signal<GmProfileDialogTabId>('profile');

  readonly mobileTabControl = new FormControl<GmProfileDialogTabId>(
    this.activeTab(),
    { nonNullable: true },
  );

  readonly displayName = computed(() => {
    const profile = this.profile();

    if (!profile) {
      return '';
    }

    return this.gmRead.getDisplayName(profile);
  });

  readonly imageUrl = computed(() => {
    const profile = this.profile();
    const imagePath = normalizeText(profile?.profile.image);

    if (!imagePath) {
      return null;
    }

    return this.storage.getPublicUrl(imagePath);
  });

  readonly systems = computed(() => {
    const profile = this.profile();

    if (!profile) {
      return [];
    }

    const seen = new Set<string>();

    return profile.sessions
      .map((session) => session.system?.name?.trim() ?? '')
      .filter((name) => {
        if (!name || seen.has(name)) {
          return false;
        }

        seen.add(name);
        return true;
      });
  });

  readonly sessionListLabels = computed<ISessionListLabels>(() => ({
    systemLabel: this.i18n.sessionForm().systemLabel,
    titleLabel: this.i18n.sessionForm().titleLabel,
    difficultyLabel: this.i18n.sessionForm().difficultyLabel,
    playersLabel: this.i18n.list().playersHeaderLabel,
    minAgeLabel: this.i18n.list().minAgeHeaderLabel,
    editLabel: '',
    deleteLabel: '',
  }));

  readonly difficultyLabels = computed<Record<SessionDifficultyLevel, string>>(
    () => {
      const difficulty = this.i18n.difficulty();

      return {
        beginner: difficulty.beginner,
        intermediate: difficulty.intermediate,
        advanced: difficulty.advanced,
      };
    },
  );

  readonly profileLanguageFlags = computed(() => {
    const profile = this.profile();

    return (
      profile?.profile.languages?.map((language) => ({
        id: language.id,
        label: language.label,
        className: this.getLanguageFlagClass(language.flagCode),
      })) ?? []
    );
  });

  constructor() {
    this.mobileTabControl.valueChanges.subscribe((tabId) => {
      if (!tabId) {
        return;
      }

      this.onTabChange(tabId);
    });
  }

  resolveTabLabel(tabId: GmProfileDialogTabId): string {
    switch (tabId) {
      case 'profile':
        return this.i18n.dialog().profileTabLabel;
      case 'sessions':
        return this.i18n.dialog().sessionsTabLabel;
    }
  }

  trackTab(_: number, tab: GmProfileDialogTabDefinition): GmProfileDialogTabId {
    return tab.id;
  }

  onTabChange(tabId: GmProfileDialogTabId): void {
    this.activeTab.set(tabId);

    if (this.mobileTabControl.value !== tabId) {
      this.mobileTabControl.setValue(tabId, { emitEvent: false });
    }
  }

  onMobileTabChange(tabId: GmProfileDialogTabId | null): void {
    if (!tabId) {
      return;
    }

    this.onTabChange(tabId);
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

  resolveDifficultyLabel(value: SessionDifficultyLevel): string {
    return this.difficultyLabels()[value];
  }

  private resetState(): void {
    this.activeTab.set('profile');
    this.mobileTabControl.setValue('profile', { emitEvent: false });
  }

  private getLanguageFlagClass(flagCode: string | null | undefined): string {
    const code = normalizeText(flagCode)?.toLowerCase();

    if (!code) {
      return '';
    }

    return `fi fi-${code}`;
  }
}
