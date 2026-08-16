import { Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { Theme } from '../../../core/services/theme/theme';
import { createCommonAccessibilityI18n } from '../../../core/translations/common.i18n';

@Component({
  selector: 'app-theme-switch',
  standalone: true,
  imports: [ReactiveFormsModule, ToggleSwitchModule],
  templateUrl: './theme-switch.html',
  styleUrl: './theme-switch.scss',
  providers: [provideTranslocoScope('common')],
})
export class ThemeSwitch {
  private readonly theme = inject(Theme);
  protected readonly accessibility = createCommonAccessibilityI18n();
  protected readonly themeControl = new FormControl(this.theme.isLight(), {
    nonNullable: true,
  });

  constructor() {
    effect(() => {
      const isLight = this.theme.isLight();

      if (this.themeControl.value !== isLight) {
        this.themeControl.setValue(isLight, { emitEvent: false });
      }
    });
  }

  protected onThemeChange(isLight: boolean): void {
    this.theme.set(isLight ? 'light' : 'dark');
  }
}
