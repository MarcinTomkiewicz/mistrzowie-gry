export type JoinThePartySeoTranslations = {
  title: string;
  description: string;
};

export type JoinThePartySectionTranslations = {
  title: string;
  subtitle: string;
};

export type JoinThePartyHeroTranslations = {
  badge: string;
  title: string;
  subtitle: string;
};

export type JoinThePartyHeroInfoTranslations = {
  title: string;
  orgMeetingFree: string;
  orgMeetingPrice: string;
  orgMeetingSchedule: string;
  orgMeetingPlace: string;
  sessionPrice: string;
};

export type JoinThePartyBulletGroupTranslations = {
  title: string;
} & Record<string, string>;

export type JoinThePartyCardItem = {
  id: number;
  title: string;
  text: string;
};
