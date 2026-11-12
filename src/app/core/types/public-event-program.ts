import type { ISession, SessionPresentation } from '../interfaces/i-session';
import type { GmProfilePresentation } from '../interfaces/i-gm-public-profile';

type SessionFields = Pick<ISession,
  | 'systemId' | 'title' | 'description' | 'image' | 'difficultyLevel'
  | 'minPlayers' | 'maxPlayers' | 'minAge'
  | 'hasReadyCharacterSheets' | 'allowsScenarioCustomization'
>;

type PublicEventSession = {
  [K in keyof SessionFields]: SessionFields[K] | null;
};

// Every confirmed RPG session uses the same complete public RPC projection.
export type PublicEventConfirmedSession = PublicEventSession &
  Pick<SessionPresentation, 'styles' | 'triggers' | 'languages'> & {
    gmDeclaredMaxPlayers: number | null;
    playerCapacityOverride: number | null;
    effectiveCapacity: number | null;
    system: SessionPresentation['system'] | null;
    characterSheets: (SessionPresentation['characterSheets'][number] & {
      thumbnailStoragePath: string | null;
      sortOrder: number;
    })[];
  };

type ProgramContext = {
  occurrenceId: string;
  occurrenceDate: string;
  displayOrder: number | null;
};

type ProgramHost = { userId: string; displayName: string | null };
type TimedProgramSlot = {
  label: string | null; startTime: string; endTime: string;
  startDayOffset?: number; endDayOffset?: number;
  space?: { id: string; name: string } | null;
  blockId?: string | null; blockPosition?: number | null;
};

export type PublicEventConfirmedEntry = ProgramContext & {
  kind: 'confirmed';
  status: 'confirmed';
  canSignup?: false;
  participantSignupSupported?: false;
  programItemId: string;
  host: ProgramHost;
  session: PublicEventConfirmedSession;
} & (
  | { timeScope: 'timed'; slot: TimedProgramSlot }
  | { timeScope: 'event'; slot: { label: null; startTime: null; endTime: null; startDayOffset?: never; endDayOffset?: never };
      canSignup: false; participantSignupSupported: false }
);

export type PublicEventPendingEntry = ProgramContext & {
  kind: 'pending';
  status: 'pending';
  programItemId: null;
  host: null;
  session: null;
  canSignup: false;
} & (
  | { displayOrder: number; slot: TimedProgramSlot }
  | { displayOrder: null; slot: { label: null; startTime: null; endTime: null; startDayOffset?: never; endDayOffset?: never } }
);

export type PublicEventActivityEntry = ProgramContext & {
  kind: 'confirmed'; status: 'confirmed'; source: 'manual_activity'; activityId: string;
  programItemId: null; host: null; session: null; canSignup: false; participantSignupSupported: false;
  activity: {
    kindKey: string; kindLabel: string; title: string; description: string;
    presenter: string | null; attendeeCapacity: number | null;
  };
  slot: TimedProgramSlot & {
    startDayOffset: number; endDayOffset: number; blockPosition: number | null;
    space: { id: string; name: string } | null;
  };
};

// UI discriminants are normalized by decodePublicEventProgram, not guaranteed by the RPC.
export type PublicEventProgramEntry =
  PublicEventConfirmedEntry | PublicEventActivityEntry | PublicEventPendingEntry;

export type PublicEventProgramData = {
  entries: PublicEventProgramEntry[];
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
