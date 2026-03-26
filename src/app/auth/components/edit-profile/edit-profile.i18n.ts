import { translateSignal } from '@jsverse/transloco';

export function createEditProfileI18n() {
  const seoTitle = translateSignal('editProfile.seo.title', {}, { scope: 'auth' });
  const seoDescription = translateSignal(
    'editProfile.seo.description',
    {},
    { scope: 'auth' },
  );

  const title = translateSignal('editProfile.hero.title', {}, { scope: 'auth' });
  const subtitle = translateSignal(
    'editProfile.hero.subtitle',
    {},
    { scope: 'auth' },
  );

  const profileTabLabel = translateSignal(
    'editProfile.tabs.profile',
    {},
    { scope: 'auth' },
  );

  const gmProfileTabLabel = translateSignal(
    'editProfile.tabs.gmProfile',
    {},
    { scope: 'auth' },
  );

  const gmSessionsTabLabel = translateSignal(
    'editProfile.tabs.gmSessions',
    {},
    { scope: 'auth' },
  );

  return {
    seoTitle,
    seoDescription,
    title,
    subtitle,
    profileTabLabel,
    gmProfileTabLabel,
    gmSessionsTabLabel,
  };
}