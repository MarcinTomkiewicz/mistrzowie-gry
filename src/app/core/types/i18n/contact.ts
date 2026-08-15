export type ContactSeoTranslations = {
  description: string;
};

export type ContactHeroTranslations = {
  title: string;
  subtitle: string;
};

export type ContactFormTranslations = {
  title: string;
  hint: string;
  topicLabel: string;
  topicCustomLabel: string;
  companyLabel: string;
  phoneLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
};

export type ContactFormErrorsTranslations = {
  required: string;
  email: string;
  minMessage: string;
};

export type ContactSuccessTranslations = {
  mailSent: string;
};

export type ContactToastTranslations = {
  invalidFormSummary: string;
  mailSentSummary: string;
  sendFailedSummary: string;
};

export type ContactInfoTranslations = {
  subtitle: string;
  emailValue: string;
  phoneValue: string;
};

export type ContactTopicTranslation =
  | { id: number; value: 'join' }
  | { id: number; value: 'chaotic' }
  | {
      id: number;
      value:
        | 'business'
        | 'institution'
        | 'party'
        | 'individual'
        | 'pricing'
        | 'other';
      label: string;
    };
