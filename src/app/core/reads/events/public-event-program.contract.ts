import type {
  PublicEventProgramEntry,
  PublicEventProgramWireEntry,
  PublicEventSession,
} from '../../types/public-event-program';
import { SessionDifficultyLevel } from '../../types/sessions';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeNullableBoolean,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const readSession = createStrictEdgeObjectReader({
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
});

export function decodePublicEventProgram(
  entries: PublicEventProgramWireEntry[],
): PublicEventProgramEntry[] {
  return entries.map((entry, index): PublicEventProgramEntry => {
    if (entry.kind === 'pending') return entry;

    const path = `publicEventProgram[${index}].session`;
    const session: PublicEventSession = readSession(entry.session, path);
    if (entry.kind === 'confirmed') {
      assertEdgeContract(!!session.title?.trim(), `${path}.title`, 'non-blank text');
    }
    return { ...entry, session };
  });
}
