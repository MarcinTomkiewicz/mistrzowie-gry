export interface ISocialLink {
  labelKey: string;
  href: string;
  icon: string;
}

export interface IResolvedSocialLink extends Omit<ISocialLink, 'labelKey'> {
  label: string;
}