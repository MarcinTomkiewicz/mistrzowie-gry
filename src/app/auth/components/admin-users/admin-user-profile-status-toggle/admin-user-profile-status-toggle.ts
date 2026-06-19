import { CommonModule } from '@angular/common';
import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { IGmProfile } from '../../../../core/interfaces/i-gm-profile';
import { AdminUserProfileStatusKey } from '../../../../core/types/admin-users';
import { setControlEnabled } from '../../../../core/utils/form-controls';

@Component({
  selector: 'app-admin-user-profile-status-toggle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToggleSwitchModule],
  templateUrl: './admin-user-profile-status-toggle.html',
})
export class AdminUserProfileStatusToggleComponent {
  readonly profile = input<IGmProfile | null>(null);
  readonly statusKey = input.required<AdminUserProfileStatusKey>();
  readonly disabled = input(false);
  readonly notAvailableLabel = input('');

  readonly statusChange = output<boolean>();

  protected readonly control = new FormControl(false, { nonNullable: true });

  constructor() {
    effect(() => {
      const profile = this.profile();
      this.control.setValue(!!profile?.[this.statusKey()], { emitEvent: false });
      setControlEnabled(this.control, !!profile && !this.disabled());
    });
  }

  protected onChange(value: boolean): void {
    this.statusChange.emit(value);
  }
}
