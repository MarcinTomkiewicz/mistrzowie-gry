import {
  CommonAccessibilityTranslations,
  CommonActionsTranslations,
  CommonCtaTranslations,
  CommonEmptyTranslations,
  CommonErrorsTranslations,
  CommonFormTranslations,
  CommonInfoTranslations,
  CommonLegalTranslations,
  CommonNavTranslations,
  CommonQuestionsTranslations,
  CommonSeoTranslations,
  CommonSocialTranslations,
  CommonStatusTranslations,
} from '../types/i18n/common';
import { createScopedObjectI18n } from './scoped.i18n';

function createCommonScopeSignal<T>(key: string) {
  return createScopedObjectI18n<T>('common', key);
}

export function createCommonAccessibilityI18n() {
  return createCommonScopeSignal<CommonAccessibilityTranslations>('accessibility');
}

export function createCommonActionsI18n() {
  return createCommonScopeSignal<CommonActionsTranslations>('actions');
}

export function createCommonCtaI18n() {
  return createCommonScopeSignal<CommonCtaTranslations>('cta');
}

export function createCommonEmptyI18n() {
  return createCommonScopeSignal<CommonEmptyTranslations>('empty');
}

export function createCommonErrorsI18n() {
  return createCommonScopeSignal<CommonErrorsTranslations>('errors');
}

export function createCommonFormI18n() {
  return createCommonScopeSignal<CommonFormTranslations>('form');
}

export function createCommonInfoI18n() {
  return createCommonScopeSignal<CommonInfoTranslations>('info');
}

export function createCommonLegalI18n() {
  return createCommonScopeSignal<CommonLegalTranslations>('legal');
}

export function createCommonNavI18n() {
  return createCommonScopeSignal<CommonNavTranslations>('nav');
}

export function createCommonQuestionsI18n() {
  return createCommonScopeSignal<CommonQuestionsTranslations>('questions');
}

export function createCommonSeoI18n() {
  return createCommonScopeSignal<CommonSeoTranslations>('seo');
}

export function createCommonSocialI18n() {
  return createCommonScopeSignal<CommonSocialTranslations>('social');
}

export function createCommonStatusI18n() {
  return createCommonScopeSignal<CommonStatusTranslations>('status');
}
