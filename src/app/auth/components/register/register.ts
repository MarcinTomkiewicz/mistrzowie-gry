import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';

import { Seo } from '../../../core/services/seo/seo';
import { LoginForm } from '../../common/login-form/login-form';
import { ProfileForm } from '../../common/profile-form/profile-form';
import { createRegisterI18n } from './register.i18n';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ProfileForm, LoginForm],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly seo = inject(Seo);

  readonly i18n = createRegisterI18n();

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.seoTitle(),
      description: this.i18n.seoDescription(),
    });
  });
}