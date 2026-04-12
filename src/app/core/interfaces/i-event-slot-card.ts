import { SessionDifficultyLevel } from '../types/sessions';
import { IContentTrigger } from './i-content-trigger';
import { IGmStyleOption } from './i-gm-style';
import { ILanguage } from './i-languages';
import { ISystem } from './i-system';

export interface IEventSlotCardVm {
  id: string | null;
  gmProfileId: string | null;
  title: string;
  imageUrl: string | null;
  gmDisplayName: string | null;
  system: ISystem | null;
  languages: Pick<ILanguage, 'id' | 'label' | 'flagCode'>[];
  difficultyLevel: SessionDifficultyLevel | null;
  styles: IGmStyleOption[];
  triggers: IContentTrigger[];
  minAge: number | null;
  description: string | null;
  isEmpty: boolean;
  canOpenDetails: boolean;
  canOpenGmProfile: boolean;
}

export interface IEventSlotParticipantScope {
  occurrenceId: string;
  eventProgramItemId: string | null;
}
