import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { Theme } from '../../../core/services/theme/theme';

@Component({
  selector: 'app-theme-switch',
  standalone: true,
  imports: [FormsModule, ToggleSwitchModule],
  templateUrl: './theme-switch.html',
  styleUrl: './theme-switch.scss',
})
export class ThemeSwitch {
  readonly theme = inject(Theme);

  onToggle(nextLight: boolean): void {
    this.theme.set(nextLight ? 'light' : 'dark');
  }
}