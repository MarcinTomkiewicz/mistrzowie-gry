import { Component } from '@angular/core';

import { ProfileForm } from '../../common/profile-form/profile-form';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ProfileForm],
  template: '<app-profile-form mode="edit" />',
})
export class ProfileEdit {}
