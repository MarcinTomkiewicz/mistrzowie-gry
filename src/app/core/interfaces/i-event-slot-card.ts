import { SessionDifficultyLevel } from '../types/sessions';
import { IGmStyleOption } from './i-gm-style';
import { ILanguage } from './i-languages';
import type { SessionDetailsData, SessionPresentation } from './i-session';
import type { PublicEventActivityEntry, PublicEventConfirmedSession } from '../types/public-event-program';
import type { IEventParticipantAvailability } from './i-event-participant';

export interface IEventSlotCardVm {
  id: string | null;
  title: string;
  imageUrl: string | null;
  gmDisplayName: string | null;
  system: SessionPresentation['system'] | null;
  languages?: Pick<ILanguage, 'id' | 'label' | 'flagCode'>[];
  difficultyLevel: SessionDifficultyLevel | null;
  styles?: IGmStyleOption[];
  triggers?: SessionPresentation['triggers'];
  description: string | null;
  isEmpty: boolean;
  canOpenDetails: boolean;
  canOpenGmProfile: boolean;
  programStatus?: 'confirmed' | 'pending';
  slotLabel?: string | null;
  timeLabel?: string;
  sessionDetails?: SessionDetailsData | null;
  eventCapacity?: Pick<PublicEventConfirmedSession, 'effectiveCapacity' | 'gmDeclaredMaxPlayers'> &
    Partial<Pick<IEventParticipantAvailability, 'remainingSeats'>>;
  activity?: PublicEventActivityEntry['activity'];
  participantSignup?: { canSignup: boolean; remainingSeatsLabel: string };
}
