import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../core/config/site';
import { Seo } from '../../../core/services/seo/seo';
import { ContactPayload } from '../../../core/types/contact';
import { createPageStructuredData } from '../../../core/utils/structured-data';
import { createContactI18n } from './contact.i18n';
import { ContactApi } from './contact/contact-api/contact-api';
import { SubmitState, SubmitStateEnum } from '../../../core/types/submit-state';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';

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
  private readonly contactApi = inject(ContactApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private readonly pageUrl = buildSiteUrl('/contact');

  readonly i18n = createContactI18n();

  readonly submitState = signal<SubmitState>(SubmitStateEnum.Idle);
  readonly submitError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    topic: this.fb.nonNullable.control(''),
    topicCustom: this.fb.nonNullable.control(''),

    firstName: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),
    lastName: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),

    companyName: this.fb.nonNullable.control(''),

    email: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.email],
    }),
    phone: this.fb.nonNullable.control(''),

    message: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(20)],
    }),

    website: this.fb.nonNullable.control(''), // honeypot
  });

  private readonly topicValue = toSignal(
    this.form.controls.topic.valueChanges,
    {
      initialValue: this.form.controls.topic.value,
    },
  );

  readonly isOtherTopicSelected = computed(() => this.topicValue() === 'other');

  readonly isSubmitting = computed(
    () => this.submitState() === SubmitStateEnum.Submitting,
  );

  private readonly applySeoEffect = effect(() => {
    const seo = this.i18n.seo();

    this.seo.apply({
      title: seo.title || 'Kontakt',
      description: seo.description || '',
      canonicalUrl: this.pageUrl,
      structuredData: createPageStructuredData({
        type: 'ContactPage',
        id: `${this.pageUrl}#webpage`,
        url: this.pageUrl,
        name: seo.title || 'Kontakt',
        description: seo.description || '',
      }),
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
    formErrors: this.i18n.formErrors(),
    toast: this.i18n.toast(),
    success: this.i18n.success(),
    status: this.i18n.status(),
    commonForm: this.i18n.commonForm(),
    commonErrors: this.i18n.commonErrors(),
    cta: this.i18n.cta(),
    topics: this.i18n.topics(),
    isOtherTopicSelected: this.isOtherTopicSelected(),
    info: this.i18n.info(),
    accessibility: this.i18n.accessibility(),
    isSubmitting: this.isSubmitting(),
  }));

  onSubmit(): void {
    if (this.isSubmitting()) return;

    if (this.form.invalid) {
      this.submitState.set(SubmitStateEnum.Idle);
      this.submitError.set(null);
      this.form.markAllAsTouched();

      this.toast.warn({
        summary: this.vm().toast.invalidFormSummary,
        detail: this.vm().commonForm.invalid,
      });

      return;
    }

    const payload = this.buildPayload();

    this.submitState.set(SubmitStateEnum.Submitting);
    this.submitError.set(null);

    this.contactApi
      .send(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.submitState() === SubmitStateEnum.Submitting) {
            this.submitState.set(SubmitStateEnum.Idle);
          }
        }),
      )
      .subscribe({
        next: () => {
          this.resetForm();
          this.submitState.set(SubmitStateEnum.Success);

          this.toast.success({
            summary: this.vm().toast.mailSentSummary,
            detail: this.vm().success.mailSent,
          });
        },
        error: (err) => {
          console.error('[contact] submit error', err);

          this.submitState.set(SubmitStateEnum.Error);

          const detail =
            err?.error?.error ||
            this.vm().commonErrors.generic ||
            'Nie udało się wysłać wiadomości.';

          this.submitError.set(detail);

          this.toast.danger({
            summary: this.vm().toast.sendFailedSummary,
            detail,
          });
        },
      });
  }

  private buildPayload(): ContactPayload {
    const value = this.form.getRawValue();

    return {
      topic: value.topic,
      topicCustom:
        value.topic === 'other' ? value.topicCustom.trim() : undefined,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      companyName: value.companyName.trim() || undefined,
      email: value.email.trim(),
      phone: value.phone.trim() || undefined,
      message: value.message.trim(),
      website: value.website.trim() || undefined,
    };
  }

  private resetForm(): void {
    this.form.reset({
      topic: this.i18n.topics()[0]?.value ?? '',
      topicCustom: '',
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      message: '',
      website: '',
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
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
