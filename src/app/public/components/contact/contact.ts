import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { provideTranslocoScope } from '@jsverse/transloco';

import { Seo } from '../../../core/services/seo/seo';
import { ContactPayload } from '../../../core/types/contact';
import { createContactI18n } from './contact.i18n';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  providers: [provideTranslocoScope('contact', 'common')],
})
export class Contact {
  private readonly seo = inject(Seo);
  private readonly fb = inject(FormBuilder);

  readonly i18n = createContactI18n();

  readonly form = this.fb.nonNullable.group({
    topic: this.fb.nonNullable.control(''),
    topicCustom: this.fb.nonNullable.control(''),

    firstName: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),
    lastName: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),

    company: this.fb.nonNullable.control(''),

    email: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.email],
    }),
    phone: this.fb.nonNullable.control(''),

    message: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(20)],
    }),
  });

  private readonly topicValue = toSignal(this.form.controls.topic.valueChanges, {
    initialValue: this.form.controls.topic.value,
  });

  readonly isOtherTopicSelected = computed(
    () => this.topicValue() === 'other',
  );

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.seoTitle() || 'Kontakt',
      description: this.i18n.seoDescription() || '',
    });
  });

  private readonly initDefaultTopicEffect = effect(() => {
    const options = this.i18n.topics();
    if (!options.length) return;

    const current = this.form.controls.topic.value;
    if (current) return;

    this.form.controls.topic.setValue(options[0].value);
  });

  private readonly syncTopicCustomValidatorEffect = effect(() => {
    const control = this.form.controls.topicCustom;

    if (this.isOtherTopicSelected()) {
      control.addValidators([Validators.required]);
    } else {
      control.clearValidators();
      control.setValue('');
    }

    control.updateValueAndValidity({ emitEvent: false });
  });

  readonly vm = computed(() => ({
    hero: this.i18n.hero(),
    formText: this.i18n.formText(),
    errors: this.i18n.errors(),
    cta: this.i18n.cta(),
    topics: this.i18n.topics(),
    isOtherTopicSelected: this.isOtherTopicSelected(),
    info: this.i18n.info(),
  }));

  onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const payload: ContactPayload = {
      topic: value.topic,
      topicCustom: value.topic === 'other' ? value.topicCustom : undefined,
      firstName: value.firstName,
      lastName: value.lastName,
      company: value.company || undefined,
      email: value.email,
      phone: value.phone || undefined,
      message: value.message,
    };

    console.log('[contact] submit payload', payload);
  }

  showRequiredError(name: keyof Contact['form']['controls']): boolean {
    const control = this.form.controls[name];
    return control.touched && !!control.errors?.['required'];
  }

  showEmailError(): boolean {
    const control = this.form.controls.email;
    return (
      control.touched &&
      (!!control.errors?.['required'] || !!control.errors?.['email'])
    );
  }

  showMinMessageError(): boolean {
    const control = this.form.controls.message;
    return control.touched && !!control.errors?.['minlength'];
  }
}