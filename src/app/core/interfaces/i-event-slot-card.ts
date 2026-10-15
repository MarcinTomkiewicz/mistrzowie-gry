import { SessionDifficultyLevel } from '../types/sessions';
import { IGmStyleOption } from './i-gm-style';
import { ILanguage } from './i-languages';
import type { SessionDetailsData, SessionPresentation } from './i-session';

export interface IEventSlotCardVm {
  id: string | null;
  gmProfileId: string | null;
  title: string;
  imageUrl: string | null;
  gmDisplayName: string | null;
  system: SessionPresentation['system'] | null;
  languages?: Pick<ILanguage, 'id' | 'label' | 'flagCode'>[];
  difficultyLevel: SessionDifficultyLevel | null;
  styles?: IGmStyleOption[];
  triggers?: SessionPresentation['triggers'];
  minAge: number | null;
  description: string | null;
  isEmpty: boolean;
  canOpenDetails: boolean;
  canOpenGmProfile: boolean;
  programStatus?: 'confirmed' | 'pending';
  occurrenceDate?: string;
  slotLabel?: string | null;
  timeLabel?: string;
  sessionDetails?: SessionDetailsData | null;
  participantSignup?: { canSignup: boolean; remainingSeatsLabel: string };
}

export interface IEventSlotParticipantScope {
  occurrenceId: string;
  eventProgramItemId: string | null;
}
