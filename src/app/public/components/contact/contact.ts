// path: src/app/public/components/contact/contact.ts
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

import {
  provideTranslocoScope,
  TranslocoService,
  translateObjectSignal,
  translateSignal,
} from '@jsverse/transloco';

import { Seo } from '../../../core/services/seo/seo';
import { dictToSortedArray } from '../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../core/utils/pick-translation';
import { ContactPayload, ContactTopicOption } from '../../../core/types/contact';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as any, (x) => Number((x as any)?.id ?? 0));
}

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
  providers: [provideTranslocoScope('contact'), provideTranslocoScope('common')],
})
export class Contact {
  private readonly seo = inject(Seo);
  private readonly transloco = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.transloco.setActiveLang('pl');
  }

  // ============
  // SEO (scope: contact)
  // ============
  readonly seoTitle = translateSignal('seo.title', {}, { scope: 'contact' });
  readonly seoDescription = translateSignal(
    'seo.description',
    {},
    { scope: 'contact' },
  );

  private readonly _applySeo = effect(() => {
    this.seo.apply({
      title: this.seoTitle() || 'Kontakt',
      description: this.seoDescription() || '',
    });
  });

  // ============
  // form
  // ============
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

  // ============
  // i18n
  // ============
  private readonly heroDict = translateObjectSignal('hero', {}, {
    scope: 'contact',
  });
  private readonly formDict = translateObjectSignal('form', {}, {
    scope: 'contact',
  });
  private readonly errorsDict = translateObjectSignal('errors', {}, {
    scope: 'contact',
  });
  private readonly topicsDict = translateObjectSignal('topics', {}, {
    scope: 'contact',
  });
  private readonly commonCtaDict = translateObjectSignal('cta', {}, {
    scope: 'common',
  });

  readonly hero = pickTranslations(this.heroDict, ['title', 'subtitle'] as const);

  readonly formText = pickTranslations(this.formDict, [
    'title',
    'hint',
    'topicLabel',
    'topicCustomLabel',
    'firstNameLabel',
    'lastNameLabel',
    'companyLabel',
    'emailLabel',
    'phoneLabel',
    'messageLabel',
    'messagePlaceholder',
  ] as const);

  readonly errors = pickTranslations(this.errorsDict, [
    'required',
    'email',
    'minMessage',
  ] as const);

  readonly cta = pickTranslations(this.commonCtaDict, ['sendMessage'] as const);

  // ============
  // topics
  // ============
  readonly topics = computed<ContactTopicOption[]>(() => {
    const list = toSortedById<ContactTopicOption>(this.topicsDict());
    return list.map((x) => ({
      id: Number((x as any)?.id ?? 0),
      value: String((x as any)?.value ?? ''),
      label: String((x as any)?.label ?? ''),
    }));
  });

  private readonly topicValue = toSignal(this.form.controls.topic.valueChanges, {
    initialValue: this.form.controls.topic.value,
  });

  readonly isOtherTopicSelected = computed(() => this.topicValue() === 'other');

  private readonly _initDefaultTopic = effect(() => {
    const options = this.topics();
    if (!options.length) return;

    const current = this.form.controls.topic.value;
    if (current) return;

    this.form.controls.topic.setValue(options[0].value);
  });

  private readonly _syncTopicCustomValidator = effect(() => {
    const ctrl = this.form.controls.topicCustom;

    if (this.isOtherTopicSelected()) {
      ctrl.addValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue('');
    }

    ctrl.updateValueAndValidity({ emitEvent: false });
  });

  // ============
  // submit (mock)
  // ============
  onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: ContactPayload = {
      topic: v.topic,
      topicCustom: v.topic === 'other' ? v.topicCustom : undefined,
      firstName: v.firstName,
      lastName: v.lastName,
      company: v.company || undefined,
      email: v.email,
      phone: v.phone || undefined,
      message: v.message,
    };

    console.log('[contact] submit payload', payload);
  }

  // ============
  // template helpers
  // ============
  showRequiredError(name: keyof Contact['form']['controls']): boolean {
    const c = this.form.controls[name];
    return c.touched && !!c.errors?.['required'];
  }

  showEmailError(): boolean {
    const c = this.form.controls.email;
    return c.touched && (!!c.errors?.['required'] || !!c.errors?.['email']);
  }

  showMinMessageError(): boolean {
    const c = this.form.controls.message;
    return c.touched && !!c.errors?.['minlength'];
  }
}
