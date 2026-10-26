import type {
  PublicEventConfirmedSession,
  PublicEventProgramEntry,
  PublicEventProgramWireEntry,
  PublicEventSession,
} from '../../types/public-event-program';
import { SessionDifficultyLevel } from '../../types/sessions';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeBoolean,
  readEdgeInteger,
  readEdgeNullableBoolean,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeString,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const sessionFieldReaders = {
  systemId: createEdgeNullableReader(readEdgeUuid),
  title: readEdgeNullableString,
  description: readEdgeNullableString,
  image: readEdgeNullableString,
  difficultyLevel: createEdgeNullableReader(
    createEdgeLiteralReader([
      SessionDifficultyLevel.Beginner,
      SessionDifficultyLevel.Intermediate,
      SessionDifficultyLevel.Advanced,
    ]),
  ),
  minPlayers: readEdgeNullableInteger,
  maxPlayers: readEdgeNullableInteger,
  minAge: readEdgeNullableInteger,
  hasReadyCharacterSheets: readEdgeNullableBoolean,
  allowsScenarioCustomization: readEdgeNullableBoolean,
};

const readLegacySession = createStrictEdgeObjectReader(sessionFieldReaders);
const readConfirmedSession = createStrictEdgeObjectReader({
  ...sessionFieldReaders,
  gmDeclaredMaxPlayers: readEdgeNullableInteger,
  playerCapacityOverride: readEdgeNullableInteger,
  effectiveCapacity: readEdgeNullableInteger,
  system: createEdgeNullableReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    name: readEdgeString,
    description: readEdgeNullableString,
  })),
  styles: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    slug: readEdgeString,
    label: readEdgeString,
    sortOrder: readEdgeInteger,
    isActive: readEdgeBoolean,
  })),
  triggers: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    slug: readEdgeString,
    label: readEdgeString,
    category: readEdgeNullableString,
    aliases: createEdgeArrayReader(readEdgeString),
    isActive: readEdgeBoolean,
  })),
  languages: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    code: readEdgeString,
    label: readEdgeString,
    flagCode: readEdgeString,
    sortOrder: readEdgeInteger,
    isActive: readEdgeBoolean,
  })),
  characterSheets: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    fileName: readEdgeString,
    storagePath: readEdgeString,
    thumbnailStoragePath: readEdgeNullableString,
    sortOrder: readEdgeInteger,
  })),
});

export function decodePublicEventProgram(
  entries: PublicEventProgramWireEntry[],
): PublicEventProgramEntry[] {
  return entries.map((entry, index): PublicEventProgramEntry => {
    const path = `publicEventProgram[${index}].session`;
    if (entry.kind === 'pending') {
      assertEdgeContract(entry.session === null, path, 'null for a pending entry');
      return entry;
    }

    if (entry.kind === 'confirmed') {
      const session: PublicEventConfirmedSession = readConfirmedSession(entry.session, path);
      assertEdgeContract(!!session.title?.trim(), `${path}.title`, 'non-blank text');
      return { ...entry, session };
    }

    const session: PublicEventSession = readLegacySession(entry.session, path);
    return { ...entry, session };
  });
}
