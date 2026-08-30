import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { provideTranslocoScope } from '@jsverse/transloco';

import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE,
  buildSiteUrl,
} from '../../../core/config/site';
import { CONTACT_FORM_CONFIG } from '../../../core/configs/contact-form.config';
import { LegalDialogs } from '../../../core/services/legal-dialogs/legal-dialogs';
import { Seo } from '../../../core/services/seo/seo';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { ContactPayload } from '../../../core/types/contact';
import { LegalDialogContent } from '../../../core/types/i18n/legal';
import { createPageStructuredData } from '../../../core/utils/structured-data';
import { LegalDialog } from '../../common/legal-dialog/legal-dialog';
import { createContactI18n } from './contact.i18n';
import { ContactApi } from './contact/contact-api/contact-api';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    LegalDialog,
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  providers: [provideTranslocoScope('contact', 'common')],
})
export class Contact {
  private readonly legalDialogs = inject(LegalDialogs);
  private readonly seo = inject(Seo);
  private readonly formBuilder = inject(FormBuilder);
  private readonly contactApi = inject(ContactApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private readonly pageUrl = buildSiteUrl('/contact');

  readonly i18n = createContactI18n();

  readonly form = this.formBuilder.nonNullable.group(CONTACT_FORM_CONFIG);
  private readonly isSubmitting = signal(false);
  private readonly isPrivacyPolicyDialogVisible = signal(false);
  private readonly privacyPolicyContent =
    signal<LegalDialogContent | null>(null);
  private readonly isPrivacyPolicyLoading = signal(false);
  private readonly privacyPolicyError = signal('');

  private readonly selectedTopic = toSignal(
    this.form.controls.topic.valueChanges,
    {
      initialValue: this.form.controls.topic.value,
    },
  );

  private readonly isOtherTopicSelected = computed(
    () => this.selectedTopic() === 'other',
  );

  private readonly syncSeo = effect(() => {
    const seo = this.i18n.seo();

    this.seo.apply({
      title: this.i18n.commonNav().contact,
      description: seo.description || '',
      canonicalUrl: this.pageUrl,
      structuredData: createPageStructuredData({
        type: 'ContactPage',
        id: `${this.pageUrl}#webpage`,
        url: this.pageUrl,
        name: this.i18n.commonNav().contact,
        description: seo.description || '',
      }),
    });
  });

  private readonly clearInactiveCustomTopic = effect(() => {
    const control = this.form.controls.topicCustom;

    if (!this.isOtherTopicSelected() && control.value) {
      control.setValue('');
    }
  });

  readonly viewModel = computed(() => {
    const content = this.privacyPolicyContent();
    const loading = this.isPrivacyPolicyLoading();
    const error = this.privacyPolicyError();
    const isSubmitting = this.isSubmitting();

    return {
      hero: this.i18n.hero(),
      form: {
        text: this.i18n.formText(),
        errors: this.i18n.formErrors(),
        topics: this.i18n.topics(),
        legalNotice: this.i18n.legalNotice(),
        isOtherTopicSelected: this.isOtherTopicSelected(),
        isSubmitting,
        submitLabel: isSubmitting
          ? this.i18n.status().sending
          : this.i18n.cta().sendMessage,
      },
      contact: {
        info: this.i18n.info(),
        accessibility: this.i18n.accessibility(),
        email: PUBLIC_CONTACT_EMAIL,
        phone: PUBLIC_CONTACT_PHONE,
      },
      privacyPolicyDialog: {
        visible: this.isPrivacyPolicyDialogVisible(),
        title: content?.title || this.i18n.commonLegal().privacyPolicy,
        subtitle: content?.subtitle ?? '',
        content: content?.content ??
          (loading ? this.i18n.status().loading : error || null),
        closeLabel: this.i18n.commonActions().close,
      },
    };
  });

  onSubmit(): void {
    if (this.isSubmitting()) return;

    const payload = this.buildPayload();

    if (this.form.invalid || !payload) {
      this.form.markAllAsTouched();

      this.toast.warn({
        summary: this.i18n.commonForm().invalidSummary,
        detail: this.i18n.commonForm().invalid,
      });

      return;
    }

    this.isSubmitting.set(true);

    this.contactApi
      .send(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.form.reset();

          this.toast.success({
            summary: this.i18n.toast().mailSentSummary,
            detail: this.i18n.success().mailSent,
          });
        },
        error: (err) => {
          console.error('[contact] submit error', err);

          const detail =
            err?.error?.error ||
            this.i18n.commonErrors().generic;

          this.toast.danger({
            summary: this.i18n.toast().sendFailedSummary,
            detail,
          });
        },
      });
  }

  async openPrivacyPolicyDialog(): Promise<void> {
    this.isPrivacyPolicyDialogVisible.set(true);
    this.privacyPolicyError.set('');
    this.privacyPolicyContent.set(null);
    this.isPrivacyPolicyLoading.set(true);

    try {
      const dialog = await this.legalDialogs.load('privacy-policy');
      this.privacyPolicyContent.set(dialog ?? null);

      if (!dialog) {
        this.privacyPolicyError.set(this.i18n.commonErrors().notFound);
      }
    } catch {
      this.privacyPolicyError.set(this.i18n.commonErrors().generic);
    } finally {
      this.isPrivacyPolicyLoading.set(false);
    }
  }

  private buildPayload(): ContactPayload | null {
    const value = this.form.getRawValue();
    const topic = this.i18n.topics().find(
      (option) => option.value === value.topic,
    );

    if (!topic) return null;

    return {
      subject: value.topic === 'other'
        ? value.topicCustom.trim()
        : topic.label,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      companyName: value.companyName.trim() || undefined,
      email: value.email.trim(),
      phone: value.phone.trim() || undefined,
      message: value.message.trim(),
      website: value.website.trim() || undefined,
    };
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

  closePrivacyPolicyDialog(): void {
    this.isPrivacyPolicyDialogVisible.set(false);
  }
}
