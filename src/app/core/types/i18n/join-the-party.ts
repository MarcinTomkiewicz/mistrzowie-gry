export type SeoCopy = {
  title: string;
  description: string;
};

export type SectionCopy = {
  title: string;
  subtitle: string;
};

export type HeroCopy = {
  badge: string;
  title: string;
  subtitle: string;
};

export type MeetingFormat = 'inPerson' | 'online';

export type MeetingFormatLabels = {
  label: string;
} & Record<MeetingFormat, string>;

export type SummaryCopy = {
  orgMeetingFree: string;
  orgMeetingPrice: string;
  orgMeetingSchedule: string;
  orgMeetingPlaceLabel: string;
  orgMeetingPlace: string;
  sessionPrice: string;
};

export type SummaryByFormat = {
  title: string;
} & Record<MeetingFormat, SummaryCopy>;

export type BulletGroupCopy = {
  title: string;
} & Record<string, string>;

export type CardCopy = {
  id: number;
  title: string;
  text: string;
};
