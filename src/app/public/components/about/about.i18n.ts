import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../core/utils/pick-translation';

export type AboutSection = {
  id: number;
  title: string;
  paragraphs: string[];
};

export type AboutCard = {
  id: number;
  title: string;
  paragraphs: string[];
};

export type AboutSeo = {
  title: string;
  description: string;
};

export type AboutHero = {
  title: string;
  subtitle: string;
};

export function createAboutI18n() {
  const commonCtaDict = translateObjectSignal(
    'cta',
    {},
    { scope: 'common' },
  );

  const heroDict = translateObjectSignal(
    'hero',
    {},
    { scope: 'about' },
  );

  const seoDict = translateObjectSignal(
    'seo',
    {},
    { scope: 'about' },
  );

  const sectionsDict = translateObjectSignal(
    'sections',
    {},
    { scope: 'about' },
  );

  const cardsDict = translateObjectSignal(
    'cards',
    {},
    { scope: 'about' },
  );

  const commonCta = computed(() =>
    pickTranslations(commonCtaDict, [
      'contactUs',
      'joinProgram',
    ] as const)(),
  );

  const hero = computed<AboutHero>(() => {
    const picked = pickTranslations(heroDict, ['title', 'subtitle'] as const)();

    return {
      title: picked.title || '',
      subtitle: picked.subtitle || '',
    };
  });

  const seo = computed<AboutSeo>(() => {
    const picked = pickTranslations(seoDict, ['title', 'description'] as const)();

    return {
      title: picked.title || 'O nas',
      description: picked.description || '',
    };
  });

  const sections = computed<AboutSection[]>(() =>
    dictToSortedArray<{ id: number; title: string; paragraphs: unknown }>(
      sectionsDict() as never,
      (item) => Number((item as { id?: number })?.id ?? 0),
    ).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      title: String((item as { title?: string })?.title ?? ''),
      paragraphs: numberedDictToStringArray(
        (item as { paragraphs?: Record<string, string> })?.paragraphs,
      ),
    })),
  );

  const cards = computed<AboutCard[]>(() =>
    dictToSortedArray<{ id: number; title: string; paragraphs: unknown }>(
      cardsDict() as never,
      (item) => Number((item as { id?: number })?.id ?? 0),
    ).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      title: String((item as { title?: string })?.title ?? ''),
      paragraphs: numberedDictToStringArray(
        (item as { paragraphs?: Record<string, string> })?.paragraphs,
      ),
    })),
  );

  return {
    seo,
    hero,
    sections,
    cards,
    commonCta,
  };
}