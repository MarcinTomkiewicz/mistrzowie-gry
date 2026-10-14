import type { ISession, SessionPresentation } from '../interfaces/i-session';
import type { GmProfilePresentation } from '../interfaces/i-gm-public-profile';
import type { ISystem } from '../interfaces/i-system';

export type JsonValue = string | number | boolean | null | JsonValue[] |
  { [key: string]: JsonValue };

type SessionFields = Pick<ISession,
  | 'systemId' | 'title' | 'description' | 'image' | 'difficultyLevel'
  | 'minPlayers' | 'maxPlayers' | 'minAge'
  | 'hasReadyCharacterSheets' | 'allowsScenarioCustomization'
>;

export type PublicEventSession = {
  [K in keyof SessionFields]: SessionFields[K] | null;
};

type ProgramContext = {
  occurrenceId: string;
  occurrenceDate: string;
  displayOrder: number | null;
};

type ProgramHost = { userId: string; displayName: string | null };
type TimedProgramSlot = { label: string | null; startTime: string; endTime: string };

export type PublicEventLegacyEntry = ProgramContext & {
  kind?: never;
  status?: never;
  canSignup?: never;
  programItemId: string;
  host: ProgramHost;
  slot: TimedProgramSlot & { label: null };
  session: PublicEventSession;
};

export type PublicEventConfirmedEntry<TSession = PublicEventSession> = ProgramContext & {
  kind: 'confirmed';
  status: 'confirmed';
  canSignup?: never;
  programItemId: string;
  host: ProgramHost & { displayName: string };
  slot: TimedProgramSlot;
  session: TSession;
};

export type PublicEventPendingEntry = ProgramContext & {
  kind: 'pending';
  status: 'pending';
  programItemId: null;
  host: null;
  session: null;
  canSignup: false;
} & (
  | { displayOrder: number; slot: TimedProgramSlot & { label: string } }
  | { displayOrder: null; slot: { label: null; startTime: null; endTime: null } }
);

export type PublicEventProgramWireEntry = PublicEventLegacyEntry |
  PublicEventConfirmedEntry<Record<keyof PublicEventSession, JsonValue>> |
  PublicEventPendingEntry;

export type PublicEventProgramEntry = PublicEventLegacyEntry |
  PublicEventConfirmedEntry | PublicEventPendingEntry;

export type PublicEventProgramData = {
  entries: PublicEventProgramEntry[];
  systems: ISystem[];
};

export type PublicEventGmProfile = {
  user: Omit<GmProfilePresentation['user'], 'email' | 'firstName' | 'useNickname'> & {
    firstName: string;
    useNickname: boolean;
  };
  profile: Omit<GmProfilePresentation['profile'], 'updatedAt' | 'isArchived'> & {
    updatedAt: string;
    isArchived: false;
  };
  sessions: (Omit<SessionPresentation, 'createdAt' | 'updatedAt' | 'characterSheets'> & {
    createdAt: string;
    updatedAt: string;
    characterSheets: [];
  })[];
};

export type PublicEventGmProfileState =
  | { kind: 'idle' | 'loading' | 'not-found' | 'error' }
  | { kind: 'ready'; profile: PublicEventGmProfile };
